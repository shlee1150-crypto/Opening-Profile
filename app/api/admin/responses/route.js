import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;


  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    throw new Error(
      "Supabase 환경변수가 설정되어 있지 않습니다."
    );
  }


  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );
}


/* =========================================================
   관리자 인증
========================================================= */

async function verifyAdmin(
  request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";


  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization.slice(
          7
        )
      : null;


  if (!token) {
    return {
      success:
        false,

      status:
        401,
    };
  }


  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
      ""
    )
      .trim()
      .toLowerCase();


  if (!adminEmail) {
    return {
      success:
        false,

      status:
        500,
    };
  }


  const supabase =
    getSupabaseAdmin();


  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token
    );


  if (
    error ||
    !data?.user
  ) {
    return {
      success:
        false,

      status:
        401,
    };
  }


  const userEmail =
    String(
      data.user.email ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    userEmail !==
    adminEmail
  ) {
    return {
      success:
        false,

      status:
        403,
    };
  }


  return {
    success:
      true,

    supabase,
  };
}


/* =========================================================
   GET
========================================================= */

export async function GET(
  request
) {
  try {

    /* =====================================================
       관리자 인증
    ===================================================== */

    const auth =
      await verifyAdmin(
        request
      );


    if (
      !auth.success
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "관리자 권한이 없습니다.",
        },
        {
          status:
            auth.status,
        }
      );
    }


    /* =====================================================
       진단 데이터
    ===================================================== */

    const {
      data:
        responses,

      error:
        responseError,
    } =
      await auth.supabase
        .from(
          "diagnosis_responses"
        )
        .select(`
          id,
          name,
          phone,
          license_number,

          has_sales_manager,
          sales_manager_name,

          privacy_consent,

          answers,
          type_scores,

          result_type,
          result_score,

          secondary_type,
          secondary_score,

          completed,

          created_at,
          completed_at
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (
      responseError
    ) {
      console.error(
        "Diagnosis responses error:",
        responseError
      );


      throw responseError;
    }


    /* =====================================================
       상담 데이터

       category
       = 기존 단일 상담 호환

       categories
       = 새 복수 상담
    ===================================================== */

    const {
      data:
        consultations,

      error:
        consultationError,
    } =
      await auth.supabase
        .from(
          "consultation_requests"
        )
        .select(`
          id,

          diagnosis_response_id,

          category,
          categories,

          needs_manager_matching,

          manager_name,

          status,

          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (
      consultationError
    ) {
      console.error(
        "Consultations error:",
        consultationError
      );


      throw consultationError;
    }


    /* =====================================================
       상담 데이터 MAP
    ===================================================== */

    const consultationMap =
      new Map();


    (
      consultations ||
      []
    ).forEach(
      (consultation) => {

        /*
          새 복수선택 데이터가 있으면
          categories 사용

          기존 데이터는
          category → 배열 형태로 자동 변환
        */

        const normalizedCategories =
          Array.isArray(
            consultation.categories
          ) &&
          consultation.categories.length >
            0
            ? consultation.categories

            : consultation.category
              ? [
                  consultation.category,
                ]

              : [];


        consultationMap.set(
          consultation.diagnosis_response_id,
          {
            ...consultation,

            categories:
              normalizedCategories,
          }
        );
      }
    );


    /* =====================================================
       진단 + 상담 합치기
    ===================================================== */

    const items =
      (
        responses ||
        []
      ).map(
        (response) => ({
          ...response,

          consultation:
            consultationMap.get(
              response.id
            ) ||
            null,
        })
      );


    /* =====================================================
       응답
    ===================================================== */

    return NextResponse.json(
      {
        success:
          true,

        items,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "Admin responses API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "관리자 데이터를 불러오지 못했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}
