import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import nodemailer from "nodemailer";

import {
  TYPE_INFO,
  TOTAL_SCORE,
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
   유틸
========================================================= */

function isValidEmail(
  email
) {

  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        email
      )
  );
}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   태그
========================================================= */

function makePills(
  items
) {

  return items
    .map(
      (item) => `

        <span style="
          display:inline-block;
          margin:0 5px 7px 0;
          padding:7px 10px;
          background:#f5f2ee;
          border-radius:999px;
          color:#655e57;
          font-size:12px;
          font-weight:700;
        ">
          ${escapeHtml(item)}
        </span>

      `
    )
    .join("");
}


/* =========================================================
   TIP
========================================================= */

function makeTips(
  tips
) {

  return tips
    .map(
      (
        tip,
        index
      ) => `

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            margin-bottom:16px;
          "
        >

          <tr>

            <td
              width="37"
              valign="top"
            >

              <div style="
                width:27px;
                height:27px;
                line-height:27px;
                border-radius:50%;
                background:#f26a21;
                color:#ffffff;
                text-align:center;
                font-size:12px;
                font-weight:900;
              ">

                ${index + 1}

              </div>

            </td>


            <td>

              <div style="
                margin-bottom:4px;
                color:#39342f;
                font-size:14px;
                font-weight:900;
              ">

                ${escapeHtml(
                  tip.title
                )}

              </div>


              <div style="
                color:#756e67;
                font-size:13px;
                line-height:1.7;
              ">

                ${escapeHtml(
                  tip.text
                )}

              </div>

            </td>

          </tr>

        </table>

      `
    )
    .join("");
}


/* =========================================================
   BULLET
========================================================= */

function makeBulletList(
  items
) {

  return `

    <ul style="
      margin:0;
      padding-left:20px;
      color:#625b54;
      font-size:13px;
      line-height:1.7;
    ">

      ${items
        .map(
          (item) => `

            <li style="
              margin-bottom:6px;
            ">
              ${escapeHtml(item)}
            </li>

          `
        )
        .join("")}

    </ul>

  `;
}


/* =========================================================
   점수바
========================================================= */

function createScoreRow(
  emoji,
  label,
  score
) {

  const numericScore =
    Number(
      score
    ) || 0;


  const percentage =
    Math.min(
      100,

      Math.round(
        (
          numericScore /
          TOTAL_SCORE
        ) *
        100
      )
    );


  return `

    <div style="
      margin-bottom:17px;
    ">

      <div style="
        margin-bottom:7px;
        font-size:13px;
        color:#625b54;
        font-weight:700;
      ">

        <span>

          ${emoji}

          ${escapeHtml(
            label
          )}

        </span>


        <strong style="
          float:right;
          color:#332e29;
        ">

          ${numericScore}점

        </strong>

      </div>


      <div style="
        width:100%;
        height:8px;
        background:#eee9e4;
        border-radius:999px;
        overflow:hidden;
      ">

        <div style="
          width:${percentage}%;
          height:8px;
          background:#f26a21;
          border-radius:999px;
        ">
        </div>

      </div>

    </div>

  `;
}


/* =========================================================
   복합형 강점
========================================================= */

function makeCombinationStrengths(
  strengths
) {

  return `

    <ul style="
      margin:0;
      padding-left:19px;
      color:#645d56;
      font-size:13px;
      line-height:1.75;
    ">

      ${strengths
        .map(
          (item) => `

            <li style="
              margin-bottom:6px;
            ">
              ${escapeHtml(item)}
            </li>

          `
        )
        .join("")}

    </ul>

  `;
}


/* =========================================================
   POST
========================================================= */

export async function POST(
  request
) {

  try {

    const body =
      await request.json();


    const {
      responseId,
      email,
    } =
      body;


    if (
      !responseId
    ) {

      return NextResponse.json(
        {

          success:
            false,

          message:
            "진단 정보가 확인되지 않습니다.",
        },

        {
          status:
            400,
        }
      );
    }


    const normalizedEmail =
      String(
        email || ""
      )
        .trim()
        .toLowerCase();


    if (
      !normalizedEmail ||
      !isValidEmail(
        normalizedEmail
      )
    ) {

      return NextResponse.json(
        {

          success:
            false,

          message:
            "이메일 주소를 정확하게 입력해주세요.",
        },

        {
          status:
            400,
        }
      );
    }


    /* =====================================================
       Gmail
    ===================================================== */

    const gmailUser =
      process.env.GMAIL_USER;


    const gmailAppPassword =
      process.env
        .GMAIL_APP_PASSWORD;


    if (
      !gmailUser ||
      !gmailAppPassword
    ) {

      console.error(
        "Gmail 환경변수가 없습니다."
      );


      return NextResponse.json(
        {

          success:
            false,

          message:
            "메일 발송 설정이 완료되지 않았습니다.",
        },

        {
          status:
            500,
        }
      );
    }


    /* =====================================================
       결과 조회
    ===================================================== */

    const supabase =
      getSupabaseAdmin();


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "diagnosis_responses"
        )
        .select(`
          result_type,
          result_score,
          secondary_type,
          secondary_score,
          type_scores,
          completed
        `)

        .eq(
          "id",
          responseId
        )

        .eq(
          "completed",
          true
        )

        .maybeSingle();


    if (
      error ||
      !data
    ) {

      console.error(
        "Diagnosis lookup error:",
        error
      );


      return NextResponse.json(
        {

          success:
            false,

          message:
            "진단 결과를 찾을 수 없습니다.",
        },

        {
          status:
            404,
        }
      );
    }


    /* =====================================================
       기본성향
    ===================================================== */

    const primaryType =
      getTypeKeyFromLabel(
        data.result_type
      );


    const secondaryType =
      getTypeKeyFromLabel(
        data.secondary_type
      );


    if (
      !primaryType ||
      !secondaryType
    ) {

      return NextResponse.json(
        {

          success:
            false,

          message:
            "진단 결과 정보가 올바르지 않습니다.",
        },

        {
          status:
            500,
        }
      );
    }


    const primary =
      TYPE_INFO[
        primaryType
      ];


    const secondary =
      TYPE_INFO[
        secondaryType
      ];


    const detail =
      primary.detail;


    /* =====================================================
       복합성향
    ===================================================== */

    const combination =
      getCombinationInfo(
        primaryType,
        secondaryType
      );


    if (
      !combination
    ) {

      return NextResponse.json(
        {

          success:
            false,

          message:
            "복합성향 정보를 확인할 수 없습니다.",
        },

        {
          status:
            500,
        }
      );
    }


    const combinationStrength =
      getCombinationStrength(
        data.result_score,
        data.secondary_score
      );


    /* =====================================================
       점수
    ===================================================== */

    const typeScores =
      data.type_scores &&
      typeof data.type_scores ===
        "object"

        ? data.type_scores

        : {};


    const scoreHtml =
      Object.entries(
        TYPE_INFO
      )
        .map(
          ([
            type,
            info,
          ]) =>

            createScoreRow(
              info.emoji,
              info.label,
              typeScores[type]
            )
        )
        .join("");


    /* =====================================================
       HTML
    ===================================================== */

    const html = `

<!DOCTYPE html>

<html lang="ko">

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    오스템임플란트 개원성향진단
  </title>

</head>


<body style="
  margin:0;
  padding:0;
  background:#f2efea;
  font-family:
    Arial,
    'Apple SD Gothic Neo',
    'Malgun Gothic',
    sans-serif;
">


<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
>

<tr>

<td
  align="center"
  style="
    padding:30px 12px;
  "
>


<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="
    max-width:640px;
    background:#ffffff;
    border-radius:20px;
    overflow:hidden;
  "
>


<!-- 브랜드 -->

<tr>

<td style="
  padding:21px 27px;
  background:#f26a21;
  color:#ffffff;
  font-size:14px;
  font-weight:900;
">

  OSSTEM IMPLANT

</td>

</tr>


<!-- 기본 결과 -->

<tr>

<td style="
  padding:38px 27px 32px;
">


  <div style="
    margin-bottom:11px;
    text-align:center;
    color:#f26a21;
    font-size:10px;
    font-weight:900;
    letter-spacing:2px;
  ">

    YOUR OPENING PROFILE

  </div>


  <div style="
    margin-bottom:7px;
    text-align:center;
    color:#7b746d;
    font-size:13px;
    font-weight:700;
  ">

    원장님의 개원 성향은

  </div>


  <div style="
    margin-bottom:17px;
    text-align:center;
    color:#27231f;
    font-size:31px;
    line-height:1.4;
    font-weight:900;
  ">

    ${primary.emoji}

    ${escapeHtml(
      primary.label
    )}

  </div>


  <div style="
    max-width:470px;
    margin:0 auto 12px;
    text-align:center;
    color:#38332e;
    font-size:19px;
    line-height:1.5;
    font-weight:900;
  ">

    ${escapeHtml(
      primary.title
    )}

  </div>


  <div style="
    max-width:470px;
    margin:0 auto;
    text-align:center;
    color:#706961;
    font-size:14px;
    line-height:1.75;
  ">

    ${escapeHtml(
      primary.description
    )}

  </div>


  <div style="
    margin-top:28px;
    padding:19px;
    background:#fff7f1;
    border:1px solid #f6d9c8;
    border-radius:14px;
  ">

    <div style="
      margin-bottom:8px;
      color:#f26a21;
      font-size:13px;
      font-weight:900;
    ">

      💡 추천 개원 방향

    </div>


    <div style="
      color:#403a35;
      font-size:14px;
      line-height:1.7;
      font-weight:700;
    ">

      ${escapeHtml(
        primary.recommendation
      )}

    </div>

  </div>


  <div style="
    margin-top:22px;
    padding:20px;
    border:1px solid #e5dfd8;
    border-radius:14px;
  ">

    <div style="
      margin-bottom:18px;
      color:#332f2b;
      font-size:15px;
      font-weight:900;
    ">

      개원성향 분석

    </div>

    ${scoreHtml}

  </div>

</td>

</tr>


<!-- 복합성향 -->

<tr>

<td style="
  padding:28px 27px;
  background:#332d28;
">


  <div style="
    margin-bottom:7px;
    color:#f8a16e;
    font-size:10px;
    font-weight:900;
    letter-spacing:1.7px;
  ">

    YOUR COMBINATION

  </div>


  <div style="
    margin-bottom:7px;
    color:#d9d2cc;
    font-size:13px;
    font-weight:700;
  ">

    ${primary.emoji}

    ${escapeHtml(
      primary.label
    )}

    ×

    ${secondary.emoji}

    ${escapeHtml(
      secondary.label
    )}

  </div>


  <div style="
    margin-bottom:8px;
    color:#ffffff;
    font-size:28px;
    font-weight:900;
  ">

    ${escapeHtml(
      combination.name
    )}

  </div>


  <div style="
    display:inline-block;
    margin-bottom:14px;
    padding:6px 10px;
    border-radius:999px;
    background:#4b4038;
    color:#f8a16e;
    font-size:11px;
    font-weight:900;
  ">

    ${escapeHtml(
      combinationStrength.label
    )}

  </div>


  <div style="
    margin-bottom:13px;
    color:#ffffff;
    font-size:16px;
    line-height:1.65;
    font-weight:900;
  ">

    “${escapeHtml(
      combination.tagline
    )}”

  </div>


  <div style="
    color:#d2cbc4;
    font-size:13px;
    line-height:1.75;
  ">

    ${escapeHtml(
      combination.description
    )}

  </div>

</td>

</tr>


<!-- 복합 강점 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:10px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    COMBINATION STRONG POINT

  </div>


  <div style="
    margin-bottom:14px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    복합성향의 강점

  </div>


  ${makeCombinationStrengths(
    combination.strengths
  )}

</td>

</tr>


<!-- 복합 주의 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:10px;
    color:#d75c47;
    font-size:11px;
    font-weight:900;
  ">

    COMBINATION CHECK POINT

  </div>


  <div style="
    margin-bottom:14px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    복합성향에서 주의할 점

  </div>


  <div style="
    padding:17px;
    background:#fff5f2;
    border-radius:13px;
  ">

    ${makeCombinationStrengths(
      combination.cautions
    )}

  </div>


  <div style="
    margin-top:15px;
    padding:17px;
    background:#332d28;
    border-radius:13px;
  ">

    <div style="
      margin-bottom:6px;
      color:#f8a16e;
      font-size:10px;
      font-weight:900;
    ">

      RECOMMENDED STRATEGY

    </div>


    <div style="
      color:#ffffff;
      font-size:16px;
      font-weight:900;
      line-height:1.6;
    ">

      “${escapeHtml(
        combination.strategy
      )}”

    </div>

  </div>

</td>

</tr>


<!-- 기본성향 상세 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    01 · PROFILE

  </div>


  <div style="
    margin-bottom:13px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    원장님의 기본 성향

  </div>


  <div style="
    color:#5f5851;
    font-size:14px;
    line-height:1.8;
  ">

    ${escapeHtml(
      detail.trait
    )}

  </div>

</td>

</tr>


<!-- 입지 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    02 · LOCATION

  </div>


  <div style="
    margin-bottom:11px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    추천 입지

  </div>


  <div style="
    margin-bottom:10px;
    color:#f26a21;
    font-size:17px;
    font-weight:900;
  ">

    📍 ${escapeHtml(
      detail.locationTitle
    )}

  </div>


  <div style="
    margin-bottom:15px;
    color:#5f5851;
    font-size:14px;
    line-height:1.75;
  ">

    ${escapeHtml(
      detail.locationDescription
    )}

  </div>


  <div>

    ${makePills(
      detail.locationPoints
    )}

  </div>

</td>

</tr>


<!-- 추천 전략 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    03 · STRATEGY

  </div>


  <div style="
    margin-bottom:11px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    추천 개원전략

  </div>


  <div style="
    margin-bottom:10px;
    color:#38332e;
    font-size:17px;
    font-weight:900;
    line-height:1.5;
  ">

    “${escapeHtml(
      detail.strategyTitle
    )}”

  </div>


  <div style="
    color:#5f5851;
    font-size:14px;
    line-height:1.8;
  ">

    ${escapeHtml(
      detail.strategy
    )}

  </div>

</td>

</tr>


<!-- 개원꿀팁 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    04 · OPENING TIP

  </div>


  <div style="
    margin-bottom:19px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    개원 꿀팁

  </div>


  ${makeTips(
    detail.tips
  )}

</td>

</tr>


<!-- 운영홍보 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#f26a21;
    font-size:11px;
    font-weight:900;
  ">

    05 · OPERATION & MARKETING

  </div>


  <div style="
    margin-bottom:12px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    운영·홍보 포인트

  </div>


  <div style="
    margin-bottom:15px;
    color:#38332e;
    font-size:16px;
    line-height:1.55;
    font-weight:900;
  ">

    “${escapeHtml(
      detail.promotionTitle
    )}”

  </div>


  <div style="
    margin-bottom:15px;
    padding:16px;
    background:#f8f6f3;
    border-radius:12px;
  ">

    ${makeBulletList(
      detail.promotionPoints
    )}

  </div>


  <div style="
    color:#5f5851;
    font-size:14px;
    line-height:1.8;
  ">

    ${escapeHtml(
      detail.promotionDescription
    )}

  </div>

</td>

</tr>


<!-- 기본 주의점 -->

<tr>

<td style="
  padding:28px 27px;
  border-bottom:1px solid #eee8e1;
">


  <div style="
    margin-bottom:12px;
    color:#dc5d45;
    font-size:11px;
    font-weight:900;
  ">

    CHECK POINT

  </div>


  <div style="
    margin-bottom:12px;
    color:#332e29;
    font-size:18px;
    font-weight:900;
  ">

    ⚠️ 기본 성향에서 주의할 점

  </div>


  <div style="
    padding:16px;
    border-left:4px solid #e6654d;
    border-radius:10px;
    background:#fff5f2;
    color:#67534d;
    font-size:14px;
    line-height:1.8;
  ">

    ${escapeHtml(
      detail.caution
    )}

  </div>

</td>

</tr>


<!-- ONE LINE -->

<tr>

<td style="
  padding:26px 27px;
  background:#332d28;
  text-align:center;
">


  <div style="
    margin-bottom:8px;
    color:#f8a16e;
    font-size:10px;
    font-weight:900;
    letter-spacing:1.7px;
  ">

    ONE LINE TIP

  </div>


  <div style="
    color:#ffffff;
    font-size:18px;
    line-height:1.6;
    font-weight:900;
  ">

    “${escapeHtml(
      detail.oneLineTip
    )}”

  </div>

</td>

</tr>


<!-- FOOTER -->

<tr>

<td style="
  padding:24px 27px;
  background:#f8f5f1;
  text-align:center;
  color:#99918a;
  font-size:11px;
  line-height:1.7;
">

  오스템임플란트 개원성향진단

  <br />

  본 결과는 개원 의사결정 성향을
  알아보기 위한 참고자료입니다.

</td>

</tr>


</table>

</td>

</tr>

</table>

</body>

</html>

    `;


    /* =====================================================
       TEXT
    ===================================================== */

    const text = `

오스템임플란트 개원성향진단


[기본 성향]

${primary.emoji} ${primary.label}

${primary.title}

${primary.description}


[복합 성향]

${primary.emoji} ${primary.label}
+
${secondary.emoji} ${secondary.label}

${combination.name}

${combinationStrength.label}

"${combination.tagline}"

${combination.description}


[복합성향 강점]

${combination.strengths
  .map(
    (item) =>
      `- ${item}`
  )
  .join("\n")}


[복합성향 주의사항]

${combination.cautions
  .map(
    (item) =>
      `- ${item}`
  )
  .join("\n")}


추천전략

"${combination.strategy}"


[기본 성향 상세 분석]


1. 원장님의 성향

${detail.trait}


2. 추천 입지

${detail.locationTitle}

${detail.locationDescription}

${detail.locationPoints
  .map(
    (item) =>
      `- ${item}`
  )
  .join("\n")}


3. 추천 개원전략

"${detail.strategyTitle}"

${detail.strategy}


4. 개원 꿀팁

${detail.tips
  .map(
    (
      tip,
      index
    ) =>
      `${index + 1}) ${tip.title}\n${tip.text}`
  )
  .join("\n\n")}


5. 운영·홍보 포인트

"${detail.promotionTitle}"

${detail.promotionPoints
  .map(
    (item) =>
      `- ${item}`
  )
  .join("\n")}

${detail.promotionDescription}


6. 주의할 점

${detail.caution}


ONE LINE TIP

"${detail.oneLineTip}"


[개원성향 점수]

안정정착형:
${Number(
  typeScores.stable || 0
)}점

집중공격형:
${Number(
  typeScores.aggressive || 0
)}점

데이터분석형:
${Number(
  typeScores.analytical || 0
)}점

선점개척형:
${Number(
  typeScores.pioneer || 0
)}점


오스템임플란트 개원성향진단

    `.trim();


    /* =====================================================
       Gmail
    ===================================================== */

    const transporter =
      nodemailer.createTransport({

        host:
          "smtp.gmail.com",

        port:
          465,

        secure:
          true,

        auth: {

          user:
            gmailUser,

          pass:
            gmailAppPassword,
        },
      });


    await transporter.sendMail({

      from:
        `"오스템임플란트 개원성향진단" <${gmailUser}>`,

      to:
        normalizedEmail,

      subject:
        `[오스템임플란트] 개원성향진단 - ${combination.name} (${primary.label})`,

      text,

      html,
    });


    return NextResponse.json({

      success:
        true,

      message:
        "상세 진단 결과 이메일을 발송했습니다.",
    });


  } catch (error) {

    console.error(
      "Send email error:",
      error
    );


    return NextResponse.json(
      {

        success:
          false,

        message:
          "이메일 발송 중 오류가 발생했습니다.",
      },

      {
        status:
          500,
      }
    );
  }
}
