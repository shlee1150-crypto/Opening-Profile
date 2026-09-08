import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = [
  "location",
  "process",
  "major_equipment",
  "supplies",
];

const ALLOWED_LOCATION_STATUSES = [
  "completed",
  "in_progress",
  "planned",
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
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(
      value ||
      ""
    )
  );
}

function cleanText(
  value,
  maxLength
) {
  return String(
    value ??
    ""
  )
    .trim()
    .slice(
      0,
      maxLength
    );
}

function parseInteger(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    return null;
  }

  return parsed;
}

function normalizeCategories(
  value,
  legacyCategory
) {
  const source =
    Array.isArray(
      value
    )
      ? value
      : legacyCategory
        ? [
            legacyCategory,
          ]
        : [];

  return [
    ...new Set(
      source
        .map(
          (item) =>
            String(
              item ||
              ""
            ).trim()
        )
        .filter(
          (item) =>
            ALLOWED_CATEGORIES.includes(
              item
            )
        )
    ),
  ];
}

export async function GET(
  request
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const diagnosisResponseId =
      String(
        searchParams.get(
          "responseId"
        ) ||
        searchParams.get(
          "diagnosisResponseId"
        ) ||
        ""
      ).trim();

    if (
      !isUuid(
        diagnosisResponseId
      )
    ) {
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

    const supabase =
      getSupabaseAdmin();

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
        .select(
          "id, completed, has_sales_manager, sales_manager_name"
        )
        .eq(
          "id",
          diagnosisResponseId
        )
        .maybeSingle();

    if (
      diagnosisError
    ) {
      console.error(
        "Consultation GET diagnosis error:",
        diagnosisError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "진단 정보를 확인하지 못했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !diagnosis ||
      diagnosis.completed !==
        true
    ) {
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

    const {
      data:
        consultation,

      error:
        consultationError,
    } =
      await supabase
        .from(
          "consultation_requests"
        )
        .select(
          "id, category, categories, needs_manager_matching, manager_name, desired_region, planned_opening_year, planned_opening_month, location_selection_status, memo, status, created_at, updated_at"
        )
        .eq(
          "diagnosis_response_id",
          diagnosisResponseId
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          1
        )
        .maybeSingle();

    if (
      consultationError
    ) {
      console.error(
        "Consultation GET request error:",
        consultationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "상담 신청 정보를 확인하지 못했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    const normalizedConsultation =
      consultation
        ? {
            ...consultation,

            categories:
              Array.isArray(
                consultation.categories
              ) &&
              consultation.categories.length >
                0
                ? consultation.categories
                : consultation.category
                  ? [
                      consultation.category,
                    ]
                  : [],
          }
        : null;

    return NextResponse.json(
      {
        success: true,

        diagnosis: {
          id:
            diagnosis.id,

          has_sales_manager:
            diagnosis.has_sales_manager ===
            true,

          sales_manager_name:
            diagnosis.sales_manager_name ||
            null,
        },

        consultation:
          normalizedConsultation,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Consultation GET API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "상담 정보를 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request
) {
  try {
    const body =
      await request.json();

    const diagnosisResponseId =
      String(
        body?.diagnosisResponseId ||
        body?.diagnosis_response_id ||
        body?.responseId ||
        ""
      ).trim();

    if (
      !isUuid(
        diagnosisResponseId
      )
    ) {
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

    const categories =
      normalizeCategories(
        body?.categories,
        body?.category
      );

    if (
      categories.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "희망 상담을 한 가지 이상 선택해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const desiredRegion =
      cleanText(
        body?.desiredRegion ??
          body?.desired_region,
        120
      );

    if (
      !desiredRegion
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "개원 희망 지역을 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const plannedOpeningYear =
      parseInteger(
        body?.plannedOpeningYear ??
          body?.planned_opening_year
      );

    const plannedOpeningMonth =
      parseInteger(
        body?.plannedOpeningMonth ??
          body?.planned_opening_month
      );

    if (
      plannedOpeningYear ===
        null ||
      plannedOpeningYear <
        2000 ||
      plannedOpeningYear >
        2999
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "개원 예정 연도를 4자리 숫자로 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      plannedOpeningMonth ===
        null ||
      plannedOpeningMonth <
        1 ||
      plannedOpeningMonth >
        12
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "개원 예정 월을 1~12 사이 숫자로 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const locationSelectionStatus =
      String(
        body?.locationSelectionStatus ||
        body?.location_selection_status ||
        ""
      ).trim();

    if (
      !ALLOWED_LOCATION_STATUSES.includes(
        locationSelectionStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "입지선정 상태를 선택해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const memo =
      cleanText(
        body?.memo,
        2000
      );

    const supabase =
      getSupabaseAdmin();

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
        .select(
          "id, completed, has_sales_manager, sales_manager_name"
        )
        .eq(
          "id",
          diagnosisResponseId
        )
        .maybeSingle();

    if (
      diagnosisError
    ) {
      console.error(
        "Consultation diagnosis lookup error:",
        diagnosisError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "진단 정보를 확인하지 못했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !diagnosis ||
      diagnosis.completed !==
        true
    ) {
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

    const hasNonLocation =
      categories.some(
        (category) =>
          category !==
          "location"
      );

    const hasExistingSalesManager =
      diagnosis.has_sales_manager ===
      true;

    let needsManagerMatching =
      false;

    let managerName =
      "";

    if (
      !hasExistingSalesManager &&
      hasNonLocation
    ) {
      const requestedMatching =
        body?.needsManagerMatching ??
        body?.needs_manager_matching;

      if (
        typeof requestedMatching !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "영업담당자 매칭 필요 여부를 선택해주세요.",
          },
          {
            status: 400,
          }
        );
      }

      needsManagerMatching =
        requestedMatching;

      if (
        !needsManagerMatching
      ) {
        managerName =
          cleanText(
            body?.managerName ??
              body?.manager_name,
            80
          );

        if (
          !managerName
        ) {
          return NextResponse.json(
            {
              success: false,

              message:
                "현재 오스템 영업담당자 이름을 입력해주세요.",
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    const payload = {
      diagnosis_response_id:
        diagnosisResponseId,

      category:
        categories[0] ||
        null,

      categories,

      needs_manager_matching:
        needsManagerMatching,

      manager_name:
        managerName ||
        null,

      desired_region:
        desiredRegion,

      planned_opening_year:
        plannedOpeningYear,

      planned_opening_month:
        plannedOpeningMonth,

      location_selection_status:
        locationSelectionStatus,

      memo:
        memo ||
        null,
    };

    const {
      data:
        existing,

      error:
        existingError,
    } =
      await supabase
        .from(
          "consultation_requests"
        )
        .select(
          "id, status"
        )
        .eq(
          "diagnosis_response_id",
          diagnosisResponseId
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          1
        )
        .maybeSingle();

    if (
      existingError
    ) {
      console.error(
        "Existing consultation lookup error:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "기존 상담 신청 정보를 확인하지 못했습니다.",
        },
        {
          status: 500,
        }
      );
    }

    let savedConsultation =
      null;

    if (
      existing?.id
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "consultation_requests"
          )
          .update({
            ...payload,

            status:
              existing.status ||
              "new",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existing.id
          )
          .select(
            "id, diagnosis_response_id, category, categories, needs_manager_matching, manager_name, desired_region, planned_opening_year, planned_opening_month, location_selection_status, memo, status, created_at, updated_at"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Consultation update error:",
          error
        );

        return NextResponse.json(
          {
            success: false,

            message:
              "상담 신청 저장에 실패했습니다.",
          },
          {
            status: 500,
          }
        );
      }

      savedConsultation =
        data;
    } else {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "consultation_requests"
          )
          .insert({
            ...payload,

            status:
              "new",
          })
          .select(
            "id, diagnosis_response_id, category, categories, needs_manager_matching, manager_name, desired_region, planned_opening_year, planned_opening_month, location_selection_status, memo, status, created_at, updated_at"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Consultation insert error:",
          error
        );

        return NextResponse.json(
          {
            success: false,

            message:
              "상담 신청 저장에 실패했습니다.",
          },
          {
            status: 500,
          }
        );
      }

      savedConsultation =
        data;
    }

    return NextResponse.json(
      {
        success: true,

        consultation:
          savedConsultation,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Consultation API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "상담 신청 처리 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
