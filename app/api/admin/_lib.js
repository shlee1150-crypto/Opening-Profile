import { createClient } from "@supabase/supabase-js";


function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}


function getVerifierKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
}


function getSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}


function createServerClient(key) {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl || !key) {
    throw new Error(
      "Supabase 서버 환경변수가 설정되어 있지 않습니다."
    );
  }

  return createClient(
    supabaseUrl,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}


/* ========================================
   허용 관리자 이메일
======================================== */

function getAllowedAdminEmails() {
  const value =
    process.env.ADMIN_EMAIL || "";

  return value
    .split(",")
    .map((email) =>
      email.trim().toLowerCase()
    )
    .filter(Boolean);
}


/* ========================================
   관리자 인증
======================================== */

export async function requireAdmin(
  request
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      ) || "";

    const match =
      authorization.match(
        /^Bearer\s+(.+)$/i
      );

    if (!match) {
      return {
        ok: false,
        status: 401,
        message:
          "로그인이 필요합니다.",
      };
    }

    const accessToken =
      match[1];

    const verifier =
      createServerClient(
        getVerifierKey()
      );

    const {
      data: { user },
      error,
    } =
      await verifier.auth.getUser(
        accessToken
      );

    if (error || !user) {
      return {
        ok: false,
        status: 401,
        message:
          "로그인 정보가 유효하지 않습니다.",
      };
    }

    const userEmail =
      user.email
        ?.trim()
        .toLowerCase();

    const adminEmails =
      getAllowedAdminEmails();

    if (
      adminEmails.length === 0
    ) {
      console.error(
        "ADMIN_EMAIL is not configured."
      );

      return {
        ok: false,
        status: 500,
        message:
          "관리자 설정이 완료되지 않았습니다.",
      };
    }

    if (
      !userEmail ||
      !adminEmails.includes(
        userEmail
      )
    ) {
      return {
        ok: false,
        status: 403,
        message:
          "관리자 권한이 없습니다.",
      };
    }

    return {
      ok: true,
      user,
      accessToken,
    };
  } catch (error) {
    console.error(
      "Admin auth error:",
      error
    );

    return {
      ok: false,
      status: 500,
      message:
        "관리자 인증 중 오류가 발생했습니다.",
    };
  }
}


/* ========================================
   관리자 DB Client
======================================== */

export function getAdminDatabase() {
  return createServerClient(
    getSecretKey()
  );
}


/* ========================================
   전체 진단 결과 조회

   Supabase API 기본 반환 제한을
   고려하여 1000개씩 반복 조회
======================================== */

export async function fetchAllResponses() {
  const supabase =
    getAdminDatabase();

  const pageSize = 1000;

  let start = 0;

  let allRows = [];

  while (true) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "diagnosis_responses"
      )
      .select(`
        id,
        name,
        phone,
        license_number,
        privacy_consent,
        privacy_consent_at,
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
          ascending: false,
        }
      )
      .range(
        start,
        start +
          pageSize -
          1
      );

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    allRows =
      allRows.concat(rows);

    if (
      rows.length <
      pageSize
    ) {
      break;
    }

    start += pageSize;
  }

  return allRows;
}
