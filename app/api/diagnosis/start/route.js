import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase 서버 환경변수가 설정되어 있지 않습니다."
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

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const licenseNumber =
      body.licenseNumber?.trim();

    const privacyConsent =
      body.privacyConsent === true;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "이름을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "휴대폰 번호를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!licenseNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "면허번호를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!privacyConsent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "개인정보 수집 및 이용에 동의해주세요.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("diagnosis_responses")
      .insert({
        name,
        phone,
        license_number: licenseNumber,

        privacy_consent: true,
        privacy_consent_at:
          new Date().toISOString(),

        answers: {},
        type_scores: {},

        result_type: null,
        result_score: null,

        secondary_type: null,
        secondary_score: null,

        completed: false,
        completed_at: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        "Supabase insert error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "정보 저장 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      responseId: data.id,
    });
  } catch (error) {
    console.error(
      "Diagnosis start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "정보 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
