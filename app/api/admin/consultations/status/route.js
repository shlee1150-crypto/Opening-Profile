import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";


const VALID_STATUS = [
  "new",
  "reviewing",
  "assigned",
  "completed",
];


function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다."
    );
  }

  return createClient(
    url,
    key,
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
    return null;
  }

  const supabase =
    getSupabaseAdmin();

  const {
    data,
  } =
    await supabase.auth.getUser(
      token
    );

  if (!data?.user) {
    return null;
  }

  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
        ""
    ).toLowerCase();

  if (
    String(
      data.user.email ||
        ""
    ).toLowerCase() !==
    adminEmail
  ) {
    return null;
  }

  return supabase;
}


export async function PATCH(
  request
) {
  try {
    const supabase =
      await verifyAdmin(
        request
      );

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const {
      consultationId,
      status,
    } = body;


    if (
      !consultationId ||
      !VALID_STATUS.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "상담 상태 정보를 확인해주세요.",
        },
        {
          status: 400,
        }
      );
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "consultation_requests"
        )
        .update({
          status,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          consultationId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    return NextResponse.json({
      success: true,
      consultation: data,
    });
  } catch (error) {
    console.error(
      "Consultation status:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "상담 상태 변경 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
