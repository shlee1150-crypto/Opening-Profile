import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CATEGORY_LABELS = {
  location: "입지",
  process: "프로세스 상담",
  major_equipment: "대장비",
  supplies: "소장비·기구·재료",
};

const CONSULTATION_STATUS_LABELS = {
  new: "신규",
  reviewing: "확인중",
  assigned: "담당자 배정",
  completed: "상담 완료",
};

const LOCATION_SELECTION_LABELS = {
  completed: "완료",
  in_progress: "진행중",
  planned: "추후예정",
};

const OPENING_TYPE_LABELS = {
  new_opening: "신규개원",
  relocation: "이전개원",
  acquisition: "인수개원",
  reopening: "재개원",
  confirmed: "확정",
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase 환경변수가 설정되어 있지 않습니다."
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

async function verifyAdmin(request) {
  const authorization =
    request.headers.get("authorization") || "";

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return {
      success: false,
      status: 401,
    };
  }

  const adminEmail = String(
    process.env.ADMIN_EMAIL || ""
  )
    .trim()
    .toLowerCase();

  if (!adminEmail) {
    return {
      success: false,
      status: 500,
    };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } =
    await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      success: false,
      status: 401,
    };
  }

  const userEmail = String(
    data.user.email || ""
  )
    .trim()
    .toLowerCase();

  if (userEmail !== adminEmail) {
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

function csvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let text = String(value);

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function normalizeCategories(consultation) {
  if (!consultation) {
    return [];
  }

  if (
    Array.isArray(consultation.categories) &&
    consultation.categories.length > 0
  ) {
    return consultation.categories;
  }

  return consultation.category
    ? [consultation.category]
    : [];
}

function getAnswerText(answers, index) {
  const entry = answers?.[`q${index}`];

  if (!entry) {
    return "";
  }

  if (typeof entry === "string") {
    return entry;
  }

  return entry.answer || entry.label || entry.value || "";
}

export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 권한이 없습니다.",
        },
        { status: auth.status }
      );
    }

    const {
      data: responses,
      error: responseError,
    } = await auth.supabase
      .from("diagnosis_responses")
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
        has_sales_manager,
        sales_manager_name,
        created_at,
        completed_at
      `)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (responseError) {
      console.error(
        "CSV diagnosis responses error:",
        responseError
      );
      throw responseError;
    }

    const {
      data: consultations,
      error: consultationError,
    } = await auth.supabase
      .from("consultation_requests")
      .select(`
        id,
        diagnosis_response_id,
        category,
        categories,
        opening_types,
        needs_manager_matching,
        manager_name,
        desired_region,
        planned_opening_year,
        planned_opening_month,
        location_selection_status,
        chair_count,
        memo,
        consultant_name,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (consultationError) {
      console.error(
        "CSV consultations error:",
        consultationError
      );
      throw consultationError;
    }

    const consultationMap = new Map();

    (consultations || []).forEach((consultation) => {
      if (
        consultation?.diagnosis_response_id &&
        !consultationMap.has(
          consultation.diagnosis_response_id
        )
      ) {
        consultationMap.set(
          consultation.diagnosis_response_id,
          consultation
        );
      }
    });

    const headers = [
      "등록일",
      "진단완료일",
      "이름",
      "연락처",
      "면허번호",
      "개인정보동의",
      "영업담당자 유무",
      "기존 영업담당자",
      "주성향",
      "주성향 점수",
      "보조성향",
      "보조성향 점수",
      "상담 신청 여부",
      "개원종류",
      "개원 희망 지역",
      "개원 예정 연도",
      "개원 예정 월",
      "입지선정",
      "체어규모",
      "희망 상담",
      "영업담당자 매칭 필요",
      "상담에서 입력한 영업담당자",
      "상담 상태",
      "상담 신청일",
      "메모",
      "상담자",
      ...Array.from(
        { length: 12 },
        (_, index) => `Q${index + 1} 응답`
      ),
    ];

    const rows = (responses || []).map((item) => {
      const consultation =
        consultationMap.get(item.id) || null;

      const categories =
        normalizeCategories(consultation);

      const consultationLabels = categories
        .map(
          (category) =>
            CATEGORY_LABELS[category] || category
        )
        .join(" / ");

      const openingTypeLabels = Array.isArray(
        consultation?.opening_types
      )
        ? consultation.opening_types
            .map(
              (type) =>
                OPENING_TYPE_LABELS[type] || type
            )
            .join(" / ")
        : "";

      const hasNonLocation = categories.some(
        (category) => category !== "location"
      );

      let matchingLabel = "";

      if (consultation) {
        if (!hasNonLocation) {
          matchingLabel = "해당없음";
        } else if (item.has_sales_manager === true) {
          matchingLabel = "기존 담당자 있음";
        } else {
          matchingLabel =
            consultation.needs_manager_matching === true
              ? "필요"
              : "불필요";
        }
      }

      return [
        formatDate(item.created_at),
        formatDate(item.completed_at),
        item.name || "",
        item.phone || "",
        item.license_number || "",
        item.privacy_consent === true ? "동의" : "미동의",
        item.has_sales_manager === true ? "있음" : "없음",
        item.sales_manager_name || "",
        item.result_type || "",
        item.result_score ?? "",
        item.secondary_type || "",
        item.secondary_score ?? "",
        consultation ? "신청" : "미신청",
        openingTypeLabels,
        consultation?.desired_region || "",
        consultation?.planned_opening_year ?? "",
        consultation?.planned_opening_month ?? "",
        consultation
          ? LOCATION_SELECTION_LABELS[
              consultation.location_selection_status
            ] || ""
          : "",
        consultation?.chair_count ?? "",
        consultationLabels,
        matchingLabel,
        consultation?.manager_name || "",
        consultation
          ? CONSULTATION_STATUS_LABELS[
              consultation.status
            ] || consultation.status || ""
          : "",
        formatDate(consultation?.created_at),
        consultation?.memo || "",
        consultation?.consultant_name || "",
        ...Array.from(
          { length: 12 },
          (_, index) =>
            getAnswerText(item.answers, index + 1)
        ),
      ];
    });

    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) =>
        row.map(csvCell).join(",")
      ),
    ].join("\r\n");

    const bomCsv = `\uFEFF${csv}`;

    return new Response(bomCsv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="opening-profile.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin CSV export error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "CSV 파일 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
