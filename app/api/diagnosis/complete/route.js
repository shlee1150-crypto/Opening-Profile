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

    const {
      responseId,
      answers,
      typeScores,
      resultType,
      resultScore,
      secondaryType,
      secondaryScore,
    } = body;

    if (!responseId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "참여자 정보가 확인되지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !answers ||
      typeof answers !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "설문 응답 정보가 올바르지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !typeScores ||
      typeof typeScores !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "점수 정보가 올바르지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (!resultType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "최종 결과가 확인되지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from(
        "diagnosis_responses"
      )
      .update({
        answers,

        type_scores:
          typeScores,

        result_type:
          resultType,

        result_score:
          resultScore,

        secondary_type:
          secondaryType ||
          null,

        secondary_score:
          secondaryScore ??
          null,

        completed:
          true,

        completed_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        responseId
      )
      .select(
        "id, result_token"
      )
      .single();

    if (error) {
      console.error(
        "Supabase update error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "진단 결과 저장 중 오류가 발생했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    if (!data.result_token) {
      console.error(
        "Result token missing"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "결과 링크 생성에 실패했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      responseId:
        data.id,

      resultToken:
        data.result_token,
    });
  } catch (error) {
    console.error(
      "Diagnosis complete error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "진단 결과 저장 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
