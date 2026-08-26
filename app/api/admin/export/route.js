import {
  createClient,
} from "@supabase/supabase-js";

import {
  TYPE_INFO,
  getTypeKeyFromLabel,
  getCombinationInfo,
  getCombinationStrength,
} from "../../../lib/diagnosisData";


export const runtime =
  "nodejs";


/* =========================================================
   Supabase
========================================================= */

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
      ? authorization.slice(7)
      : null;


  if (!token) {
    return {
      success:
        false,

      status:
        401,
    };
  }


  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
      ""
    )
      .trim()
      .toLowerCase();


  if (!adminEmail) {
    return {
      success:
        false,

      status:
        500,
    };
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
    return {
      success:
        false,

      status:
        401,
    };
  }


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
    return {
      success:
        false,

      status:
        403,
    };
  }


  return {
    success:
      true,

    supabase,
  };
}


/* =========================================================
   날짜
========================================================= */

function formatDate(
  value
) {
  if (!value) {
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

        second:
          "2-digit",

        hour12:
          false,
      }
    ).format(
      new Date(value)
    );

  } catch {
    return value;
  }
}


/* =========================================================
   문항 개수
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
   버전
========================================================= */

function getSurveyVersion(
  answers
) {
  const count =
    getQuestionCount(
      answers
    );


  if (
    count >= 12
  ) {
    return "12문항";
  }


  if (
    count > 0
  ) {
    return `${count}문항(이전)`;
  }


  return "";
}


/* =========================================================
   답변
========================================================= */

function getAnswerText(
  answers,
  questionNumber
) {
  const entry =
    answers?.[
      `q${questionNumber}`
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
    entry.text ||
    ""
  );
}


/* =========================================================
   CSV
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
    const auth =
      await verifyAdmin(
        request
      );


    if (!auth.success) {
      return new Response(
        "Unauthorized",
        {
          status:
            auth.status,
        }
      );
    }


    const {
      data,
      error,
    } =
      await auth.supabase
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
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (error) {
      console.error(
        "Export query error:",
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


    const headers = [
      "이름",
      "휴대폰번호",
      "면허번호",

      "진단시작일",
      "진단완료일",

      "상태",
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


    const rows =
      (data || []).map(
        (item) => {

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


          return [
            item.name,
            item.phone,
            item.license_number,

            formatDate(
              item.created_at
            ),

            formatDate(
              item.completed_at
            ),

            item.completed
              ? "완료"
              : "진행중",

            getSurveyVersion(
              item.answers
            ),

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


    /*
      Excel에서 한글이 깨지지 않도록
      UTF-8 BOM 추가
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
