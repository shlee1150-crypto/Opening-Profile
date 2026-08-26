import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_CATEGORIES = [
  "location",
  "major_equipment",
  "supplies",
];

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

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      responseId,
      category,
      needsManagerMatching,
      managerName,
    } = body;

    if (!isValidUuid(responseId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "진단 정보를 확인할 수 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_CATEGORIES.includes(
        category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "상담 항목을 다시 선택해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    let normalizedNeedsMatching =
      null;

    let normalizedManagerName =
      null;

    /*
      입지 상담
      → 담당자 매칭 질문 없음
    */

    if (category === "location") {
      normalizedNeedsMatching =
        null;

      normalizedManagerName =
        null;
    } else {
      /*
        대장비 / 소장비
        → 담당자 매칭 여부 필수
      */

      if (
        typeof needsManagerMatching !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "지역 담당자 매칭 여부를 선택해주세요.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedNeedsMatching =
        needsManagerMatching;

      /*
        매칭 불필요
        → 기존 담당자 이름 필수
      */

      if (
        needsManagerMatching === false
      ) {
        normalizedManagerName =
          String(
            managerName || ""
          ).trim();

        if (
          normalizedManagerName.length <
          2
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "현재 오스템 담당자 이름을 입력해주세요.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          normalizedManagerName.length >
          50
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "담당자 이름을 확인해주세요.",
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    const supabase =
      getSupabaseAdmin();

    /*
      실제 완료된 진단인지 확인
    */

    const {
      data: diagnosis,
      error: diagnosisError,
    } = await supabase
      .from(
        "diagnosis_responses"
      )
      .select(
        "id, completed"
      )
      .eq(
        "id",
        responseId
      )
      .maybeSingle();

    if (
      diagnosisError ||
      !diagnosis ||
      !diagnosis.completed
    ) {
      console.error(
        "Consultation diagnosis lookup:",
        diagnosisError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "완료된 진단 결과를 확인할 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      진단 1건당 상담신청 1건.

      이미 신청했다면 새 행을 만들지 않고
      기존 내용을 수정한다.
    */

    const {
      data,
      error,
    } = await supabase
      .from(
        "consultation_requests"
      )
      .upsert(
        {
          diagnosis_response_id:
            responseId,

          category,

          needs_manager_matching:
            normalizedNeedsMatching,

          manager_name:
            normalizedManagerName,

          /*
            다시 신청/변경할 경우
            관리자가 다시 확인할 수 있게
            신규 상태로 초기화
          */

          status:
            "new",

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "diagnosis_response_id",
        }
      )
      .select(
        `
          id,
          diagnosis_response_id,
          category,
          needs_manager_matching,
          manager_name,
          status,
          created_at,
          updated_at
        `
      )
      .single();

    if (error) {
      console.error(
        "Consultation save error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "상담 신청 저장 중 오류가 발생했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      consultation: data,
    });
  } catch (error) {
    console.error(
      "Consultation API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "상담 신청 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
