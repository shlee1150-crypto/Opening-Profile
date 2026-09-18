import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

import {
  TYPE_INFO,
  getCombinationInfo,
  getCombinationStrength,
  getTypeKeyFromLabel,
} from "../../../lib/diagnosisData";

export const runtime = "nodejs";

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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim()
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTypeKey(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  if (TYPE_INFO[raw]) {
    return raw;
  }

  try {
    return getTypeKeyFromLabel(raw) || null;
  } catch {
    return null;
  }
}

function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `
    <ul style="margin:10px 0 0;padding-left:20px;color:#5e5751;font-size:14px;line-height:1.75;">
      ${items
        .map(
          (item) =>
            `<li style="margin:4px 0;">${escapeHtml(item)}</li>`
        )
        .join("")}
    </ul>
  `;
}

function renderScoreRows(typeScores) {
  const scores =
    typeScores && typeof typeScores === "object"
      ? typeScores
      : {};

  return Object.entries(TYPE_INFO)
    .map(([key, info]) => {
      const score = Number(scores[key] || 0);

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee8e3;color:#4a433d;font-size:14px;">
            ${escapeHtml(info.emoji)} ${escapeHtml(info.label)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee8e3;text-align:right;color:#f26a21;font-size:14px;font-weight:800;">
            ${score}점
          </td>
        </tr>
      `;
    })
    .join("");
}

async function ensureConsultationToken(
  supabase,
  diagnosisId,
  existingToken
) {
  if (isUuid(existingToken)) {
    return existingToken;
  }

  const token = randomUUID();

  const { error } = await supabase
    .from("diagnosis_responses")
    .update({
      consultation_token: token,
    })
    .eq("id", diagnosisId);

  if (error) {
    console.error(
      "Consultation token update error:",
      error
    );

    throw new Error(
      "상담 신청 링크를 생성하지 못했습니다."
    );
  }

  return token;
}

function buildEmailHtml({
  diagnosis,
  consultationUrl,
}) {
  const primaryType = normalizeTypeKey(
    diagnosis.result_type
  );
  const secondaryType = normalizeTypeKey(
    diagnosis.secondary_type
  );

  const primaryInfo = primaryType
    ? TYPE_INFO[primaryType]
    : null;

  const secondaryInfo = secondaryType
    ? TYPE_INFO[secondaryType]
    : null;

  const combination =
    primaryType && secondaryType
      ? getCombinationInfo(
          primaryType,
          secondaryType
        )
      : null;

  const strength =
    combination
      ? getCombinationStrength(
          Number(diagnosis.result_score || 0),
          Number(diagnosis.secondary_score || 0)
        )
      : null;

  const detail = primaryInfo?.detail || {};

  const primaryLabel =
    primaryInfo?.label ||
    diagnosis.result_type ||
    "-";

  const secondaryLabel =
    secondaryInfo?.label ||
    diagnosis.secondary_type ||
    "-";

  const nameText = diagnosis.name
    ? `${escapeHtml(diagnosis.name)} 원장님`
    : "원장님";

  return `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>오스템임플란트 개원성향진단 결과</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f2ef;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#332f2b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f2ef;padding:24px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 36px rgba(70,50,35,.08);">
            <tr>
              <td style="padding:34px 32px 28px;background:#fff7f1;border-bottom:1px solid #f0e5dc;">
                <div style="color:#f26a21;font-size:12px;font-weight:800;letter-spacing:.14em;">OSSTEM IMPLANT</div>
                <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.3;color:#2f2a26;">개원성향진단 결과</h1>
                <p style="margin:0;color:#756e68;font-size:14px;line-height:1.7;">
                  ${nameText}의 개원 성향을 분석한 결과입니다.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:50%;padding:16px;background:#fff8f3;border:1px solid #f1ded0;border-radius:14px;vertical-align:top;">
                      <div style="color:#9a9189;font-size:11px;font-weight:700;">주성향</div>
                      <div style="margin-top:7px;color:#312c28;font-size:18px;font-weight:900;">
                        ${escapeHtml(primaryInfo?.emoji || "")} ${escapeHtml(primaryLabel)}
                      </div>
                      <div style="margin-top:5px;color:#f26a21;font-size:13px;font-weight:800;">
                        ${Number(diagnosis.result_score || 0)}점
                      </div>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="width:50%;padding:16px;background:#faf9f7;border:1px solid #ebe5df;border-radius:14px;vertical-align:top;">
                      <div style="color:#9a9189;font-size:11px;font-weight:700;">보조성향</div>
                      <div style="margin-top:7px;color:#312c28;font-size:18px;font-weight:900;">
                        ${escapeHtml(secondaryInfo?.emoji || "")} ${escapeHtml(secondaryLabel)}
                      </div>
                      <div style="margin-top:5px;color:#7e756d;font-size:13px;font-weight:800;">
                        ${Number(diagnosis.secondary_score || 0)}점
                      </div>
                    </td>
                  </tr>
                </table>

                ${
                  combination
                    ? `
                <div style="margin-top:18px;padding:22px;border-radius:16px;background:#332d28;color:#ffffff;">
                  <div style="font-size:11px;font-weight:800;color:#f4b28a;letter-spacing:.08em;">COMBINATION PROFILE</div>
                  <h2 style="margin:8px 0 5px;font-size:22px;line-height:1.35;color:#ffffff;">${escapeHtml(combination.name)}</h2>
                  <div style="display:inline-block;margin-top:3px;padding:5px 9px;border-radius:999px;background:#fff0e6;color:#f26a21;font-size:11px;font-weight:800;">${escapeHtml(strength?.label || "복합성향")}</div>
                  <p style="margin:12px 0 0;color:#e5ded8;font-size:14px;line-height:1.75;">${escapeHtml(combination.tagline || combination.description || "")}</p>
                </div>
                    `
                    : ""
                }

                <div style="margin-top:26px;">
                  <h3 style="margin:0 0 10px;font-size:18px;color:#332f2b;">개원성향 분석</h3>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${renderScoreRows(diagnosis.type_scores)}
                  </table>
                </div>

                ${
                  detail.trait
                    ? `
                <div style="margin-top:28px;padding:20px;border:1px solid #e8e2dc;border-radius:15px;background:#ffffff;">
                  <h3 style="margin:0 0 8px;font-size:17px;color:#332f2b;">성향 특징</h3>
                  <p style="margin:0;color:#655d56;font-size:14px;line-height:1.75;">${escapeHtml(detail.trait)}</p>
                </div>
                    `
                    : ""
                }

                ${
                  detail.locationTitle || detail.locationDescription
                    ? `
                <div style="margin-top:14px;padding:20px;border:1px solid #e8e2dc;border-radius:15px;background:#fffaf6;">
                  <h3 style="margin:0 0 8px;font-size:17px;color:#332f2b;">${escapeHtml(detail.locationTitle || "추천 입지")}</h3>
                  <p style="margin:0;color:#655d56;font-size:14px;line-height:1.75;">${escapeHtml(detail.locationDescription || "")}</p>
                  ${renderList(detail.locationPoints)}
                </div>
                    `
                    : ""
                }

                ${
                  detail.strategyTitle || detail.strategy
                    ? `
                <div style="margin-top:14px;padding:20px;border-radius:15px;background:#f8f5f1;">
                  <h3 style="margin:0 0 8px;font-size:17px;color:#332f2b;">${escapeHtml(detail.strategyTitle || "개원 전략")}</h3>
                  <p style="margin:0;color:#655d56;font-size:14px;line-height:1.75;">${escapeHtml(detail.strategy || "")}</p>
                  ${renderList(detail.tips)}
                </div>
                    `
                    : ""
                }

                ${
                  combination?.strengths?.length
                    ? `
                <div style="margin-top:14px;padding:20px;border:1px solid #e8e2dc;border-radius:15px;background:#ffffff;">
                  <h3 style="margin:0;font-size:17px;color:#332f2b;">복합성향 강점</h3>
                  ${renderList(combination.strengths)}
                </div>
                    `
                    : ""
                }

                ${
                  combination?.cautions?.length || detail.caution
                    ? `
                <div style="margin-top:14px;padding:20px;border:1px solid #f2d5c4;border-radius:15px;background:#fff8f3;">
                  <h3 style="margin:0;font-size:17px;color:#332f2b;">체크 포인트</h3>
                  ${renderList(combination?.cautions)}
                  ${
                    detail.caution
                      ? `<p style="margin:10px 0 0;color:#785d4d;font-size:14px;line-height:1.75;">${escapeHtml(detail.caution)}</p>`
                      : ""
                  }
                </div>
                    `
                    : ""
                }

                ${
                  detail.oneLineTip
                    ? `
                <div style="margin-top:14px;padding:18px 20px;border-radius:15px;background:#332d28;color:#ffffff;">
                  <div style="font-size:11px;color:#f4b28a;font-weight:800;">ONE LINE TIP</div>
                  <div style="margin-top:6px;font-size:15px;line-height:1.65;font-weight:800;">${escapeHtml(detail.oneLineTip)}</div>
                </div>
                    `
                    : ""
                }

                <div style="margin-top:32px;padding:26px 22px;border-radius:18px;background:#fff4eb;text-align:center;border:1px solid #f2d2bd;">
                  <div style="color:#f26a21;font-size:12px;font-weight:900;letter-spacing:.05em;">OPENING CONSULTATION</div>
                  <h3 style="margin:9px 0 7px;color:#312c28;font-size:20px;">개원 상담이 필요하신가요?</h3>
                  <p style="margin:0 auto;max-width:500px;color:#756b63;font-size:13px;line-height:1.7;">
                    입지 · 개원 프로세스 · 대장비 · 소장비·기구·재료 상담을 신청하실 수 있습니다.
                  </p>

                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:20px auto 0;">
                    <tr>
                      <td align="center" bgcolor="#f26a21" style="border-radius:12px;">
                        <a href="${escapeHtml(consultationUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 30px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;line-height:1;">
                          개원 상담 신청하기
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:13px 0 0;color:#9b8d82;font-size:10px;line-height:1.5;">
                    버튼을 누르면 개원성향진단 상담 신청 화면으로 바로 이동합니다.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;background:#f8f6f3;color:#9a9189;font-size:11px;line-height:1.6;text-align:center;">
                본 메일은 개원성향진단 결과 발송 요청에 따라 전송되었습니다.<br />
                입력한 이메일 주소는 결과 발송 용도로만 사용됩니다.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const responseId = String(
      body?.responseId ||
        body?.diagnosisResponseId ||
        ""
    ).trim();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!isUuid(responseId)) {
      return NextResponse.json(
        {
          success: false,
          message: "진단 결과 정보를 확인할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일 주소를 정확하게 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const gmailUser = String(
      process.env.GMAIL_USER || ""
    ).trim();

    const gmailAppPassword = String(
      process.env.GMAIL_APP_PASSWORD || ""
    ).replace(/\s/g, "");

    if (!gmailUser || !gmailAppPassword) {
      console.error(
        "Result email error: Gmail environment variables are missing."
      );

      return NextResponse.json(
        {
          success: false,
          message: "이메일 발송 설정을 확인해주세요.",
        },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    const {
      data: diagnosis,
      error: diagnosisError,
    } = await supabase
      .from("diagnosis_responses")
      .select(
        "id, name, completed, type_scores, result_type, result_score, secondary_type, secondary_score, consultation_token"
      )
      .eq("id", responseId)
      .maybeSingle();

    if (diagnosisError) {
      console.error(
        "Result email diagnosis lookup error:",
        diagnosisError
      );

      return NextResponse.json(
        {
          success: false,
          message: "진단 결과를 불러오지 못했습니다.",
        },
        { status: 500 }
      );
    }

    if (!diagnosis || diagnosis.completed !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "완료된 진단 결과를 확인할 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const consultationToken =
      await ensureConsultationToken(
        supabase,
        diagnosis.id,
        diagnosis.consultation_token
      );

    const origin = new URL(request.url).origin;
    const consultationUrl =
      `${origin}/consultation?token=${encodeURIComponent(
        consultationToken
      )}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const html = buildEmailHtml({
      diagnosis,
      consultationUrl,
    });

    await transporter.sendMail({
      from: `오스템임플란트 개원성향진단 <${gmailUser}>`,
      to: email,
      subject: `[오스템임플란트] ${
        diagnosis.name
          ? `${diagnosis.name} 원장님 `
          : ""
      }개원성향진단 결과`,
      html,
      text: [
        "오스템임플란트 개원성향진단 결과",
        diagnosis.name
          ? `${diagnosis.name} 원장님`
          : "",
        `주성향: ${diagnosis.result_type || "-"} (${diagnosis.result_score ?? "-"}점)`,
        `보조성향: ${diagnosis.secondary_type || "-"} (${diagnosis.secondary_score ?? "-"}점)`,
        "",
        "개원 상담 신청하기",
        consultationUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Result email API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "이메일 발송 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
