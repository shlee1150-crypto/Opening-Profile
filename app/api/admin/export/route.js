import {
  createClient,
} from "@supabase/supabase-js";

import {
  getTypeKeyFromLabel,
  getCombinationInfo,
  getCombinationStrength,
} from "../../../lib/diagnosisData";


export const runtime =
  "nodejs";


/* =========================================================
   상담 종류
========================================================= */

const CATEGORY_LABEL = {
  location:
    "입지",

  process:
    "프로세스 상담",

  major_equipment:
    "대장비",

  supplies:
    "소장비·기구·재료",
};


/* =========================================================
   상담 상태
========================================================= */

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


/* =========================================================
   Supabase
========================================================= */

function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;


  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if (
    !url ||
    !key
  ) {
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


/* =========================================================
   관리자 인증
========================================================= */

async function verifyAdmin(
  request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";


  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization.slice(
          7
        )
      : null;


  if (
    !token
  ) {
    return null;
  }


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
    return null;
  }


  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
      ""
    )
      .trim()
      .toLowerCase();


  const userEmail =
    String(
      data.user.email ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    userEmail !==
    adminEmail
  ) {
    return null;
  }


  return supabase;
}


/* =========================================================
   날짜
========================================================= */

function formatDate(
  value
) {
  if (
    !value
  ) {
    return "";
  }


  try {
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
      new Date(
        value
      )
    );

  } catch {
    return "";
  }
}


/* =========================================================
   질문 개수
========================================================= */

function getQuestionCount(
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


/* =========================================================
   문항 답변
========================================================= */

function getAnswerText(
  answers,
  number
) {
  const entry =
    answers?.[
      `q${number}`
    ];


  if (
    !entry
  ) {
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
    entry.text ||
    ""
  );
}


/* =========================================================
   CSV 셀
========================================================= */

function csvCell(
  value
) {
  const text =
    String(
      value ?? ""
    );


  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}


/* =========================================================
   GET
========================================================= */

export async function GET(
  request
) {
  try {
    const supabase =
      await verifyAdmin(
        request
      );


    if (
      !supabase
    ) {
      return new Response(
        "Unauthorized",
        {
          status:
            403,
        }
      );
    }


    /* =====================================================
       진단 데이터
    ===================================================== */

    const {
      data:
        responses,

      error:
        responseError,
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

          has_sales_manager,
          sales_manager_name,

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
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (
      responseError
    ) {
      console.error(
        "Export diagnosis error:",
        responseError
      );


      throw responseError;
    }


    /* =====================================================
       상담 데이터
    ===================================================== */

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
        .limit(
          5000
        );


    if (
      consultationError
    ) {
      console.error(
        "Export consultation error:",
        consultationError
      );


      throw consultationError;
    }


    /* =====================================================
       상담 Map
    ===================================================== */

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


    /* =====================================================
       CSV 헤더
    ===================================================== */

    const headers = [
      "이름",

      "휴대폰번호",

      "면허번호",

      "영업담당자유무",

      "영업담당자이름",

      "진단시작일",

      "진단완료일",

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

      "상담에서입력한담당자",

      "상담상태",

      "상담신청일",

      "Q1",

      "Q2",

      "Q3",

      "Q4",

      "Q5",

      "Q6",

      "Q7",

      "Q8",

      "Q9",

      "Q10",

      "Q11",

      "Q12",
    ];


    /* =====================================================
       CSV ROWS
    ===================================================== */

    const rows =
      (
        responses ||
        []
      ).map(
        (item) => {

          /* ===============================================
             성향
          =============================================== */

          const primaryType =
            item.result_type
              ? getTypeKeyFromLabel(
                  item.result_type
                )
              : null;


          const secondaryType =
            item.secondary_type
              ? getTypeKeyFromLabel(
                  item.secondary_type
                )
              : null;


          const combination =
            primaryType &&
            secondaryType
              ? getCombinationInfo(
                  primaryType,
                  secondaryType
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
            item.type_scores &&
            typeof item.type_scores ===
              "object"
              ? item.type_scores
              : {};


          /* ===============================================
             상담
          =============================================== */

          const consultation =
            consultationMap.get(
              item.id
            );


          let consultationMatching =
            "";


          if (
            consultation
          ) {

            /*
              입지 상담은 지역 담당자
              매칭 절차 자체가 없음
            */

            if (
              consultation.category ===
              "location"
            ) {
              consultationMatching =
                "해당없음";
            }


            /*
              기존 영업담당자가 있는 경우
              자동으로 기존 담당자에게 전달
            */

            else if (
              item.has_sales_manager ===
              true
            ) {
              consultationMatching =
                "기존 담당자 있음";
            }


            /*
              기존 담당자가 없는 경우
            */

            else {
              consultationMatching =
                consultation
                  .needs_manager_matching ===
                  true
                  ? "필요"
                  : "불필요";
            }
          }


          /* ===============================================
             설문 버전
          =============================================== */

          const count =
            getQuestionCount(
              item.answers
            );


          const version =
            count >= 12
              ? "12문항"
              : count > 0
                ? `${count}문항 이전`
                : "";


          /* ===============================================
             ROW
          =============================================== */

          return [
            item.name,

            item.phone,

            item.license_number,


            /* 영업담당자 */

            item.has_sales_manager ===
            true
              ? "있음"
              : item.has_sales_manager ===
                false
                ? "없음"
                : "",


            item.sales_manager_name ||
            "",


            /* 날짜 */

            formatDate(
              item.created_at
            ),


            formatDate(
              item.completed_at
            ),


            version,


            /* 성향 */

            item.result_type ||
            "",


            item.result_score ??
            "",


            item.secondary_type ||
            "",


            item.secondary_score ??
            "",


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


            /* 상담 */

            consultation
              ? "신청"
              : "미신청",


            consultation
              ? CATEGORY_LABEL[
                  consultation.category
                ] ||
                consultation.category ||
                ""
              : "",


            consultationMatching,


            consultation
              ?.manager_name ||
              "",


            consultation
              ? STATUS_LABEL[
                  consultation.status
                ] ||
                consultation.status ||
                ""
              : "",


            consultation
              ? formatDate(
                  consultation.created_at
                )
              : "",


            /* Q1 ~ Q12 */

            ...Array.from(
              {
                length:
                  12,
              },
              (
                _,
                index
              ) =>
                getAnswerText(
                  item.answers,
                  index + 1
                )
            ),
          ];
        }
      );


    /* =====================================================
       CSV 생성
    ===================================================== */

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
              .join(
                ","
              )
        )
        .join(
          "\r\n"
        );


    /*
      Excel 한글 깨짐 방지용 UTF-8 BOM
    */

    const output =
      "\uFEFF" +
      csv;


    const date =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );


    return new Response(
      output,
      {
        status:
          200,

        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",

          "Content-Disposition":
            `attachment; filename="opening-profile-${date}.csv"`,

          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "Admin export error:",
      error
    );


    return new Response(
      "Export failed",
      {
        status:
          500,
      }
    );
  }
}
