import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


const VALID_CATEGORIES = [
  "location",
  "process",
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


function isValidUuid(
  value
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}


function normalizeCategories(
  input
) {
  if (
    !Array.isArray(
      input
    )
  ) {
    return [];
  }


  return [
    ...new Set(
      input.filter(
        (category) =>
          VALID_CATEGORIES.includes(
            category
          )
      )
    ),
  ];
}


export async function POST(
  request
) {
  try {
    const body =
      await request.json();


    const {
      responseId,

      categories,

      needsManagerMatching,

      managerName,
    } = body;


    /* =====================================================
       진단 ID 확인
    ===================================================== */

    if (
      !isValidUuid(
        responseId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "진단 정보를 확인할 수 없습니다.",
        },
        {
          status:
            400,
        }
      );
    }


    /* =====================================================
       상담 종류 검증
    ===================================================== */

    const normalizedCategories =
      normalizeCategories(
        categories
      );


    if (
      normalizedCategories.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "원하는 상담을 하나 이상 선택해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    const supabase =
      getSupabaseAdmin();


    /* =====================================================
       실제 완료된 진단인지 확인

       ★ 영업담당자 유무는
       클라이언트를 믿지 않고 DB에서 확인
    ===================================================== */

    const {
      data:
        diagnosis,

      error:
        diagnosisError,
    } =
      await supabase
        .from(
          "diagnosis_responses"
        )
        .select(`
          id,
          completed,
          has_sales_manager,
          sales_manager_name
        `)
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
          success:
            false,

          message:
            "완료된 진단 결과를 확인할 수 없습니다.",
        },
        {
          status:
            404,
        }
      );
    }


    const hasExistingSalesManager =
      diagnosis.has_sales_manager ===
      true;


    /*
      입지 이외 상담이 하나라도 포함돼 있는가
    */

    const requiresManagerDecision =
      normalizedCategories.some(
        (category) =>
          category !==
          "location"
      );


    let normalizedNeedsMatching =
      null;


    let normalizedManagerName =
      null;


    /* =====================================================
       1. 입지만 선택

       → 지역 담당자 매칭 질문 없음
    ===================================================== */

    if (
      !requiresManagerDecision
    ) {
      normalizedNeedsMatching =
        null;

      normalizedManagerName =
        null;
    }


    /* =====================================================
       2. 입지 외 상담 포함 +
          기존 영업담당자 있음

       → 매칭 질문 필요 없음
       → 기존 영업담당자에게 연결
    ===================================================== */

    else if (
      hasExistingSalesManager
    ) {
      normalizedNeedsMatching =
        false;

      normalizedManagerName =
        null;
    }


    /* =====================================================
       3. 입지 외 상담 포함 +
          기존 영업담당자 없음

       → 매칭 여부 반드시 선택
    ===================================================== */

    else {
      if (
        typeof needsManagerMatching !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "지역 담당자 매칭 여부를 선택해주세요.",
          },
          {
            status:
              400,
          }
        );
      }


      normalizedNeedsMatching =
        needsManagerMatching;


      /*
        매칭 불필요라고 선택한 경우
        현재 알고 있는 담당자 이름 필수
      */

      if (
        needsManagerMatching ===
        false
      ) {
        normalizedManagerName =
          String(
            managerName ||
            ""
          ).trim();


        if (
          normalizedManagerName.length <
          2
        ) {
          return NextResponse.json(
            {
              success:
                false,

              message:
                "현재 오스템 담당자 이름을 입력해주세요.",
            },
            {
              status:
                400,
            }
          );
        }


        if (
          normalizedManagerName.length >
          50
        ) {
          return NextResponse.json(
            {
              success:
                false,

              message:
                "담당자 이름을 확인해주세요.",
            },
            {
              status:
                400,
            }
          );
        }
      }
    }


    /* =====================================================
       저장

       category
       → 기존 시스템 호환용 첫 번째 상담

       categories
       → 실제 복수 상담 목록
    ===================================================== */

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "consultation_requests"
        )
        .upsert(
          {
            diagnosis_response_id:
              responseId,

            category:
              normalizedCategories[0],

            categories:
              normalizedCategories,

            needs_manager_matching:
              normalizedNeedsMatching,

            manager_name:
              normalizedManagerName,

            status:
              "new",

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "diagnosis_response_id",
          }
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
        .single();


    if (
      error
    ) {
      console.error(
        "Consultation save error:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "상담 신청 저장 중 오류가 발생했습니다.",
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

      consultation:
        data,

      salesManager: {
        exists:
          hasExistingSalesManager,

        name:
          diagnosis.sales_manager_name ||
          null,
      },
    });

  } catch (error) {
    console.error(
      "Consultation API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "상담 신청 중 오류가 발생했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}
