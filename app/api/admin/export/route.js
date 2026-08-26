import { createClient } from "@supabase/supabase-js";

import {
  getTypeKeyFromLabel,
  getCombinationInfo,
  getCombinationStrength,
} from "../../../lib/diagnosisData";

export const runtime =
  "nodejs";


const CATEGORY_LABEL = {
  location:
    "입지",

  major_equipment:
    "대장비",

  supplies:
    "소장비·기구·재료",
};


const STATUS_LABEL = {
  new:
    "신규",

  reviewing:
    "확인중",

  assigned:
    "담당자 배정",

  completed:
    "상담 완료",
};


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

  if (
    String(
      data.user.email ||
        ""
    ).toLowerCase() !==
    String(
      process.env.ADMIN_EMAIL ||
        ""
    ).toLowerCase()
  ) {
    return null;
  }

  return supabase;
}


function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      timeZone:
        "Asia/Seoul",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    }
  ).format(
    new Date(value)
  );
}


function questionCount(
  answers
) {
  if (
    !answers ||
    typeof answers !==
      "object"
  ) {
    return 0;
  }

  return Object.keys(
    answers
  ).filter(
    (key) =>
      /^q\d+$/.test(
        key
      )
  ).length;
}


function answerText(
  answers,
  number
) {
  const entry =
    answers?.[
      `q${number}`
    ];

  if (!entry) {
    return "";
  }

  if (
    typeof entry ===
    "string"
  ) {
    return entry;
  }

  return (
    entry.answer ||
    ""
  );
}


function csvCell(
  value
) {
  return `"${String(
    value ?? ""
  ).replaceAll(
    '"',
    '""'
  )}"`;
}


export async function GET(
  request
) {
  try {
    const supabase =
      await verifyAdmin(
        request
      );

    if (!supabase) {
      return new Response(
        "Unauthorized",
        {
          status: 403,
        }
      );
    }


    const {
      data: responses,
      error,
    } =
      await supabase
        .from(
          "diagnosis_responses"
        )
        .select(`
          id,
          name,
          phone,
          license_number,
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

    if (error) {
      throw error;
    }


    const {
      data:
        consultations,
      error:
        consultationError,
    } =
      await supabase
        .from(
          "consultation_requests"
        )
        .select(
          "*"
        )
        .limit(
          5000
        );

    if (consultationError) {
      throw consultationError;
    }


    const map =
      new Map();

    (
      consultations ||
      []
    ).forEach(
      (item) =>
        map.set(
          item.diagnosis_response_id,
          item
        )
    );


    const headers = [
      "이름",
      "휴대폰번호",
      "면허번호",

      "진단일",
      "진단버전",

      "주성향",
      "주성향점수",

      "보조성향",
      "보조성향점수",

      "복합성향",
      "복합성향강도",

      "안정정착형점수",
      "집중공격형점수",
      "데이터분석형점수",
      "선점개척형점수",

      "상담신청여부",
      "희망상담",
      "지역담당자매칭",
      "현재담당자",
      "상담상태",
      "상담신청일",

      ...Array.from(
        {
          length: 12,
        },
        (
          _,
          index
        ) =>
          `Q${index + 1}`
      ),
    ];


    const rows =
      (
        responses ||
        []
      ).map(
        (item) => {
          const primary =
            getTypeKeyFromLabel(
              item.result_type
            );

          const secondary =
            getTypeKeyFromLabel(
              item.secondary_type
            );

          const combination =
            primary &&
            secondary
              ? getCombinationInfo(
                  primary,
                  secondary
                )
              : null;

          const strength =
            combination
              ? getCombinationStrength(
                  item.result_score,
                  item.secondary_score
                )
              : null;

          const scores =
            item.type_scores ||
            {};

          const consultation =
            map.get(
              item.id
            );


          let matching =
            "";

          if (consultation) {
            if (
              consultation.category ===
              "location"
            ) {
              matching =
                "해당없음";
            } else {
              matching =
                consultation.needs_manager_matching
                  ? "필요"
                  : "불필요";
            }
          }


          return [
            item.name,
            item.phone,
            item.license_number,

            formatDate(
              item.completed_at ||
              item.created_at
            ),

            questionCount(
              item.answers
            ) >= 12
              ? "12문항"
              : `${questionCount(
                  item.answers
                )}문항 이전버전`,

            item.result_type,
            item.result_score,

            item.secondary_type,
            item.secondary_score,

            combination?.name ||
              "",

            strength?.label ||
              "",

            scores.stable ??
              "",

            scores.aggressive ??
              "",

            scores.analytical ??
              "",

            scores.pioneer ??
              "",

            consultation
              ? "신청"
              : "미신청",

            consultation
              ? CATEGORY_LABEL[
                  consultation.category
                ]
              : "",

            matching,

            consultation
              ?.manager_name ||
              "",

            consultation
              ? STATUS_LABEL[
                  consultation.status
                ]
              : "",

            consultation
              ? formatDate(
                  consultation.created_at
                )
              : "",

            ...Array.from(
              {
                length:
                  12,
              },
              (
                _,
                index
              ) =>
                answerText(
                  item.answers,
                  index + 1
                )
            ),
          ];
        }
      );


    const csv =
      [
        headers,
        ...rows,
      ]
        .map(
          (row) =>
            row
              .map(
                csvCell
              )
              .join(",")
        )
        .join("\r\n");


    return new Response(
      "\uFEFF" +
      csv,
      {
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",

          "Content-Disposition":
            `attachment; filename="opening-profile-${new Date()
              .toISOString()
              .slice(
                0,
                10
              )}.csv"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      error
    );

    return new Response(
      "Export failed",
      {
        status: 500,
      }
    );
  }
}
