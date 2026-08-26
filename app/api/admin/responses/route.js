import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


/* =========================================================
   Supabase Admin
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
      "Supabase 서버 환경변수가 설정되어 있지 않습니다."
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

   브라우저에서 전달한 Supabase Access Token 확인
   ADMIN_EMAIL과 같은 계정만 허용
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
      ? authorization.slice(7)
      : null;


  if (!token) {
    return {
      success:
        false,

      status:
        401,

      message:
        "로그인이 필요합니다.",
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
    console.error(
      "ADMIN_EMAIL 환경변수가 없습니다."
    );

    return {
      success:
        false,

      status:
        500,

      message:
        "관리자 설정이 완료되지 않았습니다.",
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

      message:
        "로그인 정보가 만료되었습니다.",
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

      message:
        "관리자 권한이 없습니다.",
    };
  }


  return {
    success:
      true,

    supabase,

    user:
      data.user,
  };
}


/* =========================================================
   GET
========================================================= */

export async function GET(
  request
) {
  try {
    const auth =
      await verifyAdmin(
        request
      );


    if (!auth.success) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }


    const {
      data,
      error,
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


    if (error) {
      console.error(
        "Admin responses error:",
        error
      );

      return NextResponse.json(
        {
          success:
            false,

          message:
            "진단 데이터를 불러오지 못했습니다.",
        },
        {
          status:
            500,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      items:
        data || [],
    });

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
          "관리자 데이터를 불러오는 중 오류가 발생했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}
