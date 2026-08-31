import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


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


  if (
    !token
  ) {
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


export async function GET(
  request
) {
  try {
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
       진단
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
      throw responseError;
    }


    /* =====================================================
       상담
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
      throw consultationError;
    }


    const consultationMap =
      new Map();


    (
      consultations ||
      []
    ).forEach(
      (item) => {

        /*
          이전 단일 상담 데이터도
          자동 호환
        */

        const normalizedCategories =
          Array.isArray(
            item.categories
          ) &&
          item.categories.length >
            0
            ? item.categories
            : item.category
              ? [
                  item.category,
                ]
              : [];


        consultationMap.set(
          item.diagnosis_response_id,
          {
            ...item,

            categories:
              normalizedCategories,
          }
        );
      }
    );


    const items =
      (
        responses ||
        []
      ).map(
        (item) => ({
          ...item,

          consultation:
            consultationMap.get(
              item.id
            ) ||
            null,
        })
      );


    return NextResponse.json({
      success:
        true,

      items,
    });

  } catch (error) {
    console.error(
      "Admin responses API:",
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
