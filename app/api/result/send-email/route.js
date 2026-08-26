import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const TYPE_INFO = {
  stable: {
    label: "안정정착형",
    emoji: "🏠",
    title:
      "오래 갈수록 강한 병원을 만드는 원장님",
    description:
      "단기적인 성과보다 안정적인 운영과 꾸준한 환자 확보를 중요하게 생각하는 성향입니다.",
    recommendation:
      "화려한 메인상권보다 꾸준한 환자가 쌓이는 주거상권이 잘 맞습니다.",
  },

  aggressive: {
    label: "집중공격형",
    emoji: "🚀",
    title:
      "할 거라면 제대로, 빠르게 성장하는 원장님",
    description:
      "좋은 기회가 보이면 적극적으로 투자하고 빠른 성장과 높은 성과를 추구하는 성향입니다.",
    recommendation:
      "좋은 입지를 잡고 적극적으로 투자해 빠르게 성장하는 전략이 잘 맞습니다.",
  },

  analytical: {
    label: "데이터분석형",
    emoji: "📊",
    title:
      "감보다 숫자가 먼저인 전략가 원장님",
    description:
      "직감보다 객관적인 데이터와 투자 대비 효율을 확인한 뒤 의사결정하는 성향입니다.",
    recommendation:
      "좋은 자리보다 데이터를 통해 원장님에게 가장 유리한 자리를 찾는 것이 좋습니다.",
  },

  pioneer: {
    label: "선점개척형",
    emoji: "🌱",
    title:
      "남들이 들어가기 전에 먼저 기회를 잡는 원장님",
    description:
      "현재의 완성도보다 미래 성장 가능성을 중요하게 보고 새로운 기회를 선점하려는 성향입니다.",
    recommendation:
      "이미 완성된 상권보다 앞으로 커질 지역을 한발 먼저 선점하는 전략이 잘 맞습니다.",
  },
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

function getTypeKeyFromLabel(label) {
  return (
    Object.keys(TYPE_INFO).find(
      (key) =>
        TYPE_INFO[key].label === label
    ) || null
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createScoreRow(
  emoji,
  label,
  score
) {
  const numericScore =
    Number(score) || 0;

  const percentage =
    Math.min(
      100,
      Math.round(
        (numericScore / 14) *
          100
      )
    );

  return `
    <div style="
      margin-bottom:18px;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:7px;
        font-size:14px;
        color:#625b54;
        font-weight:700;
      ">
        <span>
          ${emoji}
          ${escapeHtml(label)}
        </span>

        <strong style="
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
        "></div>
      </div>
    </div>
  `;
}

export async function POST(request) {
  try {
    const body =
      await request.json();

    const {
      responseId,
      email,
    } = body;

    if (!responseId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "진단 정보가 확인되지 않습니다.",
        },
        {
          status: 400,
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
          success: false,
          message:
            "이메일 주소를 정확하게 입력해주세요.",
        },
        {
          status: 400,
        }
      );
    }

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
          success: false,
          message:
            "메일 발송 설정이 완료되지 않았습니다.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    /*
      개인정보는 메일 작성에 사용하지 않습니다.

      이름
      전화번호
      면허번호

      모두 SELECT에서 제외합니다.
    */

    const {
      data,
      error,
    } = await supabase
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
          success: false,
          message:
            "진단 결과를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    const primaryType =
      getTypeKeyFromLabel(
        data.result_type
      );

    if (!primaryType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "진단 결과 정보가 올바르지 않습니다.",
        },
        {
          status: 500,
        }
      );
    }

    const primary =
      TYPE_INFO[
        primaryType
      ];

    const secondaryType =
      data.secondary_type
        ? getTypeKeyFromLabel(
            data.secondary_type
          )
        : null;

    const secondary =
      secondaryType
        ? TYPE_INFO[
            secondaryType
          ]
        : null;

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

    const secondaryHtml =
      secondary
        ? `
          <div style="
            margin-top:16px;
            padding:20px;
            background:#faf8f5;
            border:1px solid #e4ded7;
            border-radius:14px;
          ">
            <div style="
              margin-bottom:8px;
              font-size:12px;
              color:#847d75;
              font-weight:700;
            ">
              함께 나타난 보조 성향
            </div>

            <div style="
              margin-bottom:7px;
              font-size:18px;
              color:#332f2b;
              font-weight:900;
            ">
              ${secondary.emoji}
              ${escapeHtml(
                secondary.label
              )}
            </div>

            <div style="
              font-size:14px;
              line-height:1.7;
              color:#787169;
            ">
              주 성향과 함께
              ${escapeHtml(
                secondary.label
              )}
              성향도 나타났습니다.
            </div>
          </div>
        `
        : "";

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
          style="
            background:#f2efea;
          "
        >

          <tr>

            <td
              align="center"
              style="
                padding:
                  30px
                  14px;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width:600px;
                  background:#ffffff;
                  border-radius:22px;
                  overflow:hidden;
                  box-shadow:
                    0 6px 25px
                    rgba(
                      80,
                      55,
                      35,
                      0.08
                    );
                "
              >

                <tr>

                  <td
                    style="
                      padding:
                        22px
                        28px;
                      background:#f26a21;
                      color:#ffffff;
                      font-size:14px;
                      font-weight:900;
                      letter-spacing:0.5px;
                    "
                  >
                    OSSTEM IMPLANT
                  </td>

                </tr>

                <tr>

                  <td
                    style="
                      padding:
                        42px
                        28px
                        34px;
                    "
                  >

                    <div style="
                      text-align:center;
                      margin-bottom:12px;
                      color:#f26a21;
                      font-size:11px;
                      font-weight:900;
                      letter-spacing:2px;
                    ">
                      YOUR OPENING PROFILE
                    </div>

                    <div style="
                      text-align:center;
                      margin-bottom:8px;
                      color:#7b746d;
                      font-size:14px;
                      font-weight:700;
                    ">
                      원장님의 개원 성향은
                    </div>

                    <div style="
                      text-align:center;
                      margin-bottom:20px;
                      color:#27231f;
                      font-size:32px;
                      line-height:1.4;
                      font-weight:900;
                    ">
                      ${primary.emoji}
                      ${escapeHtml(
                        primary.label
                      )}
                    </div>

                    <div style="
                      max-width:460px;
                      margin:
                        0 auto 14px;
                      text-align:center;
                      color:#38332e;
                      font-size:20px;
                      line-height:1.55;
                      font-weight:900;
                    ">
                      ${escapeHtml(
                        primary.title
                      )}
                    </div>

                    <div style="
                      max-width:460px;
                      margin:0 auto;
                      text-align:center;
                      color:#706961;
                      font-size:14px;
                      line-height:1.8;
                    ">
                      ${escapeHtml(
                        primary.description
                      )}
                    </div>

                    <div style="
                      margin-top:32px;
                      padding:21px;
                      background:#fff7f1;
                      border:1px solid #f6d9c8;
                      border-radius:15px;
                    ">

                      <div style="
                        margin-bottom:9px;
                        color:#f26a21;
                        font-size:14px;
                        font-weight:900;
                      ">
                        💡 추천 개원 방향
                      </div>

                      <div style="
                        color:#403a35;
                        font-size:15px;
                        line-height:1.75;
                        font-weight:700;
                      ">
                        ${escapeHtml(
                          primary.recommendation
                        )}
                      </div>

                    </div>

                    ${secondaryHtml}

                    <div style="
                      margin-top:24px;
                      padding:21px;
                      border:1px solid #e5dfd8;
                      border-radius:15px;
                      background:#ffffff;
                    ">

                      <div style="
                        margin-bottom:20px;
                        color:#332f2b;
                        font-size:16px;
                        font-weight:900;
                      ">
                        개원성향 분석
                      </div>

                      ${scoreHtml}

                    </div>

                    <div style="
                      margin-top:30px;
                      padding-top:22px;
                      border-top:1px solid #eee8e2;
                      text-align:center;
                      color:#aaa29a;
                      font-size:11px;
                      line-height:1.7;
                    ">
                      오스템임플란트
                      개원성향진단
                      <br />
                      본 결과는 개원성향을
                      알아보기 위한 참고자료입니다.
                    </div>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

        </table>

      </body>

      </html>
    `;

    const text = `
오스템임플란트 개원성향진단

원장님의 개원성향은
${primary.emoji} ${primary.label}

${primary.title}

${primary.description}

추천 개원 방향
${primary.recommendation}

${
  secondary
    ? `함께 나타난 보조 성향: ${secondary.emoji} ${secondary.label}`
    : ""
}

개원성향 분석
안정정착형: ${Number(
      typeScores.stable || 0
    )}점
집중공격형: ${Number(
      typeScores.aggressive || 0
    )}점
데이터분석형: ${Number(
      typeScores.analytical || 0
    )}점
선점개척형: ${Number(
      typeScores.pioneer || 0
    )}점

오스템임플란트 개원성향진단
    `.trim();

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
        `[오스템임플란트] 개원성향진단 결과 - ${primary.label}`,

      text,

      html,
    });

    return NextResponse.json({
      success: true,
      message:
        "진단 결과 이메일을 발송했습니다.",
    });
  } catch (error) {
    console.error(
      "Send email error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "이메일 발송 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
