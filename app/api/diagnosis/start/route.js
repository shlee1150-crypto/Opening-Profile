import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const licenseNumber = body.licenseNumber?.trim();
    const privacyConsent = body.privacyConsent === true;

    /* =========================
       기본 입력 검증
    ========================= */

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
          message: "휴대폰 번호를 입력해주세요.",
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
          message: "개인정보 수집 및 이용에 동의해주세요.",
        },
        { status: 400 }
      );
    }

    /* =========================
       서버 전용 Supabase 연결
    ========================= */

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Supabase environment variables are missing.");

      return NextResponse.json(
        {
          success: false,
          message: "데이터베이스 연결 설정을 확인해주세요.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /* =========================
       개인정보 DB 저장
    ========================= */

    const { data, error } = await supabase
      .from("diagnosis_responses")
      .insert({
        name,
        phone,
        license_number: licenseNumber,

        privacy_consent: true,
        privacy_consent_at: new Date().toISOString(),

        answers: {},

        result_type: null,

        completed: false,
        completed_at: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "정보 저장 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    /* =========================
       생성된 참여자 ID 반환
    ========================= */

    return NextResponse.json({
      success: true,
      responseId: data.id,
    });
  } catch (error) {
    console.error("Diagnosis start error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
