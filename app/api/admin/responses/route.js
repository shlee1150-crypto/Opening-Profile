import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";


function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}


async function verifyAdmin(
  request
) {
  const auth =
    request.headers.get(
      "authorization"
    ) || "";

  const token =
    auth.startsWith(
      "Bearer "
    )
      ? auth.slice(7)
      : null;

  if (!token) {
    return {
      success: false,
      status: 401,
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
      success: false,
      status: 401,
    };
  }

  if (
    String(
      data.user.email || ""
    ).toLowerCase() !==
    adminEmail
  ) {
    return {
      success: false,
      status: 403,
    };
  }

  return {
    success: true,
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

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const {
      data: responses,
      error: responseError,
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
            ascending: false,
          }
        )
        .limit(
          5000
        );

    if (responseError) {
      throw responseError;
    }


    const {
      data: consultations,
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
          needs_manager_matching,
          manager_name,
          status,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(
          5000
        );

    if (consultationError) {
      throw consultationError;
    }


    const consultationMap =
      new Map();

    (
      consultations ||
      []
    ).forEach(
      (item) => {
        consultationMap.set(
          item.diagnosis_response_id,
          item
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
      success: true,
      items,
    });
  } catch (error) {
    console.error(
      "Admin responses:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "관리자 데이터를 불러오지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
