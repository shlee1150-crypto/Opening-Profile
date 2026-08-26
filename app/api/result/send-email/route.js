import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";


/* =========================================================
   유형별 상세 결과
========================================================= */

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

    detail: {
      trait:
        "꾸준한 매출과 환자와의 신뢰를 중요하게 생각하며, 무리한 투자보다 안정적인 운영과 장기적인 성장을 선호합니다.",

      locationTitle:
        "대단지 아파트 + 주거 밀집 상권",

      locationDescription:
        "유동인구 자체보다 실제로 지역에 거주하며 반복적으로 내원할 가능성이 높은 배후수요를 확인하는 것이 중요합니다.",

      locationPoints: [
        "대단지 아파트 배후지역",
        "가족 단위 거주자가 많은 지역",
        "학교·학원가 인근 주거상권",
        "생활형 근린상권",
        "상주인구가 많은 지역",
      ],

      strategyTitle:
        "작게 시작해서 안정적으로 자리 잡기",

      strategy:
        "배후세대와 경쟁 치과를 확인하고, 적정 규모와 감당 가능한 고정비로 시작해 지역 주민 중심의 신환을 확보하세요. 이후 재진·소개환자를 늘리며 단계적으로 확장하는 전략이 잘 맞습니다.",

      tips: [
        {
          title: "적정 규모로 시작하기",
          text:
            "초기 환자 수요에 맞춰 시작하고, 향후 체어 증설이 가능하도록 공간과 동선을 계획하세요.",
        },
        {
          title: "꾸준한 환자가 오는 자리 찾기",
          text:
            "단순 유동인구보다 실제 거주인구·배후세대·가족 환자 비중을 확인하는 것이 중요합니다.",
        },
        {
          title: "고정비 관리하기",
          text:
            "임대료·인건비·관리비·장비 리스 등 매월 발생하는 고정비를 개원 전에 미리 계산하세요.",
        },
      ],

      promotionTitle:
        "화려한 마케팅보다 신뢰와 재방문을 만들어보세요.",

      promotionPoints: [
        "정기검진·스케일링 관리",
        "예약 및 미내원 환자 관리(CRM)",
        "치료 후 관리 시스템",
        "가족 단위 환자 관리",
        "지역 밀착형 건강정보 콘텐츠",
      ],

      promotionDescription:
        "단기적인 광고 효과보다 환자가 다시 찾고 가족이나 지인에게 소개할 수 있는 경험을 만드는 것이 중요합니다. 궁극적으로는 ‘우리 동네에서 믿고 다닐 수 있는 치과’라는 이미지를 구축하는 것이 핵심입니다.",

      caution:
        "안정성을 중시한 나머지 환자 경험에 필요한 투자까지 줄이지 않는 것이 중요합니다. 대기공간·진료환경·예약 편의성·환자 응대 시스템처럼 실제 만족도에 영향을 주는 영역에는 적절히 투자하세요.",

      oneLineTip:
        "신규환자 100명보다, 한 번 온 환자가 다시 찾는 시스템을 만들어보세요.",
    },
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

    detail: {
      trait:
        "목표가 명확하고 실행이 빠르며, 성장과 매출 확대를 위해 적극적으로 투자하고 도전하는 성향입니다.",

      locationTitle:
        "역세권 · 메인상권 · 대형 상업시설 인근",

      locationDescription:
        "초기 환자 유입을 빠르게 만들 수 있도록 접근성·가시성·상권 규모를 함께 확인하는 것이 중요합니다.",

      locationPoints: [
        "지하철역 주변",
        "유동인구가 많은 중심상권",
        "오피스 + 주거 혼합지역",
        "생활권 중심 입지",
        "접근성과 가시성이 좋은 곳",
      ],

      strategyTitle:
        "좋은 입지에 집중 투자해 빠르게 키우기",

      strategy:
        "환자 유입이 높은 입지를 선정하고, 명확한 진료 차별화와 적극적인 마케팅, 충분한 진료환경을 구축해 초기 신환을 빠르게 확보하세요.",

      tips: [
        {
          title: "좋은 입지에는 과감하게 투자하기",
          text:
            "좋은 입지는 빠른 성장에 도움이 되지만, 높은 임대료가 예상 매출과 투자비를 감당할 수 있는 수준인지 반드시 확인하세요.",
        },
        {
          title: "병원의 차별점 만들기",
          text:
            "디지털 진료·임플란트·심미진료 등 원장님이 잘할 수 있는 핵심 진료 영역을 명확하게 설정하세요.",
        },
        {
          title: "초기 마케팅 예산 확보하기",
          text:
            "좋은 입지도 알려지지 않으면 환자가 오지 않습니다. 개원 전부터 오픈 초기까지의 홍보 계획과 예산을 함께 준비하세요.",
        },
      ],

      promotionTitle:
        "디지털 기술과 차별화된 진료 경험을 적극적으로 보여주세요.",

      promotionPoints: [
        "구강스캐너",
        "3D CT",
        "CAD/CAM",
        "디지털 임플란트 워크플로우",
        "디지털 진단 시스템",
        "홈페이지·SNS·정보성 콘텐츠",
      ],

      promotionDescription:
        "단순히 ‘최신 장비를 보유하고 있다’고 보여주는 것보다 해당 장비를 통해 환자가 무엇을 더 빠르고 편리하게 경험할 수 있는지를 전달하는 것이 효과적입니다.",

      caution:
        "‘좋은 건 다 넣자’는 방식은 피해야 합니다. 디지털 장비, 대형 인테리어, 직원 증원, 마케팅을 한꺼번에 진행하면 초기 고정비가 급격히 증가할 수 있습니다. 성장을 위한 투자와 보여주기 위한 투자를 구분하세요.",

      oneLineTip:
        "투자는 과감하게, 결정은 숫자로 확인하고 하세요.",
    },
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

    detail: {
      trait:
        "감보다 근거를 중요하게 생각하고, 입지·경쟁·비용·수익성을 꼼꼼하게 비교한 후 합리적으로 결정하는 성향입니다.",

      locationTitle:
        "특정 상권보다 ‘데이터로 검증된 최적 입지’",

      locationDescription:
        "역세권인지 주거상권인지보다 여러 후보지를 동일한 기준으로 비교해 원장님에게 가장 유리한 입지를 찾는 것이 중요합니다.",

      locationPoints: [
        "배후세대",
        "주요 환자층",
        "경쟁 치과",
        "예상 환자수",
        "임대료",
        "초기 투자비",
      ],

      strategyTitle:
        "데이터 → 비교 → 최적화",

      strategy:
        "후보지 3~5곳을 비교하고 배후세대·연령대·소득·경쟁 치과·예상 환자수·임대료 등을 종합해 투자 대비 수익성이 높은 곳을 선택하세요.",

      tips: [
        {
          title: "후보지는 최소 2~3곳 비교하기",
          text:
            "한 곳만 보고 결정하지 말고 동일한 기준표를 만들어 여러 후보지를 비교하세요.",
        },
        {
          title: "매출보다 수익 보기",
          text:
            "예상 매출뿐 아니라 임대료·인건비·장비비 등 고정비와 초기 투자비를 함께 계산하세요.",
        },
        {
          title: "분석에만 머물지 않기",
          text:
            "‘꼭 필요한 조건’과 ‘있으면 좋은 조건’을 구분하고 의사결정 기준을 정해 적절한 결정 시점을 놓치지 마세요.",
        },
      ],

      promotionTitle:
        "데이터를 ‘홍보 타깃’을 정하는 데 활용하세요.",

      promotionPoints: [
        "상권·경쟁 데이터로 지역 환자층과 경쟁 상황 파악",
        "소아·가족 / 직장인 / 중장년층 등 핵심 환자층 설정",
        "주요 환자층에 맞춘 지역형 건강정보 콘텐츠 제작",
      ],

      promotionDescription:
        "젊은 가족층이 많은 지역이라면 가족·어린이 구강관리 정보를, 직장인 중심 지역이라면 직장인에게 필요한 구강관리 정보를 제공하는 식으로 데이터와 콘텐츠 방향을 연결할 수 있습니다.",

      caution:
        "데이터를 많이 모으는 것 자체가 목적이 되어서는 안 됩니다. 측정 → 분석 → 결정 → 실행으로 이어질 수 있도록 의사결정 기준과 실행 시점을 함께 정하세요.",

      oneLineTip:
        "좋은 자리를 찾기보다, 원장님에게 가장 유리한 자리를 찾아보세요.",
    },
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

    detail: {
      trait:
        "새로운 기회와 미래 성장성을 중요하게 생각하며, 현재보다 앞으로 성장할 지역을 한발 먼저 선점하는 데 강점이 있습니다.",

      locationTitle:
        "신도시 · 신규 택지 · 대규모 개발지역",

      locationDescription:
        "현재의 유동인구만 보기보다 향후 인구 증가와 생활권 형성 가능성을 확인하되, 계획이 실제 수요로 이어지는 시점을 검증해야 합니다.",

      locationPoints: [
        "신규 아파트 입주지역",
        "대규모 택지개발지역",
        "신흥 주거지역",
        "역세권 개발 예정지역",
        "대규모 상업시설 입점 예정지역",
        "향후 인구 증가가 예상되는 지역",
      ],

      strategyTitle:
        "미래 수요를 선점하되, 타이밍은 데이터로 확인하기",

      strategy:
        "개발계획 → 입주 예정 세대 → 실제 입주율 → 상권 형성 → 경쟁 치과 → 환자 유입을 단계적으로 확인하고 적절한 진입 시점을 잡으세요.",

      tips: [
        {
          title: "개발 예정과 실제 개발 구분하기",
          text:
            "계획 발표만 확인하지 말고 실제 착공 여부와 공사 일정, 입주 일정을 함께 확인하세요.",
        },
        {
          title: "입주율 확인하기",
          text:
            "계획 세대수가 많더라도 실제 거주자가 적으면 초기 환자 확보에 예상보다 긴 시간이 걸릴 수 있습니다.",
        },
        {
          title: "버틸 수 있는 기간 계산하기",
          text:
            "상권이 충분히 형성되기 전까지 필요한 인건비·임대료·운영비를 감당할 수 있도록 운영자금을 미리 확보하세요.",
        },
      ],

      promotionTitle:
        "새로운 지역의 첫 번째 선택지가 되어보세요.",

      promotionPoints: [
        "가족·어린이·젊은 부부 등 신규 입주민 중심의 환자층 파악",
        "초기 지역 인지도를 확보해 ‘지역과 함께 성장한 치과’로 브랜딩",
        "체어 증설·디지털 장비·직원 증가·진료과목 확대가 가능한 구조 설계",
      ],

      promotionDescription:
        "새로운 지역에서는 기존 치과와의 경쟁보다 초기 인지도를 누가 먼저 확보하느냐가 중요할 수 있습니다. 상권 성장과 병원의 성장 계획을 함께 설계하세요.",

      caution:
        "가장 큰 위험은 ‘앞으로 잘될 것’이라는 기대만으로 너무 빨리 진입하는 것입니다. 개발계획 → 입주율 → 상권 형성 → 실제 환자 유입을 순서대로 확인하세요.",

      oneLineTip:
        "선점은 빠르게, 진입 시점은 신중하게!",
    },
  },
};


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


/* =========================================================
   유틸
========================================================= */

function getTypeKeyFromLabel(label) {
  return (
    Object.keys(TYPE_INFO).find(
      (key) =>
        TYPE_INFO[key].label ===
        label
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


function makePills(items) {
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


function makeTips(tips) {
  return tips
    .map(
      (tip, index) => `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="margin-bottom:16px;"
        >
          <tr>
            <td
              width="36"
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


function makeBulletList(items) {
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
        (numericScore / 14) * 100
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
          ${escapeHtml(label)}
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
   POST
========================================================= */

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
      String(email || "")
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
      process.env.GMAIL_APP_PASSWORD;


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


    if (error || !data) {
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
      TYPE_INFO[primaryType];

    const detail =
      primary.detail;


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


    /* =====================================================
       점수
    ===================================================== */

    const scoreHtml =
      Object.entries(
        TYPE_INFO
      )
        .map(
          ([type, info]) =>
            createScoreRow(
              info.emoji,
              info.label,
              typeScores[type]
            )
        )
        .join("");


    /* =====================================================
       보조 성향
    ===================================================== */

    const secondaryHtml =
      secondary
        ? `
          <div style="
            margin-top:15px;
            padding:18px;
            background:#faf8f5;
            border:1px solid #e4ded7;
            border-radius:14px;
          ">
            <div style="
              margin-bottom:7px;
              font-size:11px;
              color:#847d75;
              font-weight:700;
            ">
              함께 나타난 보조 성향
            </div>

            <div style="
              margin-bottom:5px;
              font-size:17px;
              color:#332f2b;
              font-weight:900;
            ">
              ${secondary.emoji}
              ${escapeHtml(
                secondary.label
              )}
            </div>

            <div style="
              color:#787169;
              font-size:13px;
              line-height:1.6;
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


    /* =====================================================
       이메일 HTML
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


<!-- 간략 결과 -->

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


  ${secondaryHtml}


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


<!-- 상세 리포트 헤더 -->

<tr>

<td style="
  padding:27px;
  background:#332d28;
">

  <div style="
    margin-bottom:8px;
    color:#f8a16e;
    font-size:10px;
    font-weight:900;
    letter-spacing:1.7px;
  ">
    DETAILED OPENING REPORT
  </div>

  <div style="
    margin-bottom:8px;
    color:#ffffff;
    font-size:23px;
    line-height:1.4;
    font-weight:900;
  ">
    ${primary.emoji}
    ${escapeHtml(
      primary.label
    )} 상세 분석
  </div>

  <div style="
    color:#d8d1cb;
    font-size:13px;
    line-height:1.7;
  ">
    원장님의 개원 성향을
    실제 입지·투자·운영 관점에서
    조금 더 구체적으로 정리했습니다.
  </div>

</td>

</tr>


<!-- 성향 -->

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
    원장님의 성향
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


<!-- 전략 -->

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


<!-- 꿀팁 -->

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


<!-- 홍보 -->

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


<!-- 주의 -->

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
    ⚠️ 주의할 점
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


<!-- TIP -->

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


<!-- Footer -->

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

  본 결과는 개원성향을 알아보기 위한
  참고자료입니다.

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
       텍스트 버전
    ===================================================== */

    const text = `
오스템임플란트 개원성향진단

[진단 결과]

${primary.emoji} ${primary.label}

${primary.title}

${primary.description}

추천 개원 방향
${primary.recommendation}


[상세 분석]

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
    (tip, index) =>
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


개원성향 분석

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
       Gmail 발송
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
        `[오스템임플란트] 개원성향진단 상세 결과 - ${primary.label}`,

      text,

      html,
    });


    return NextResponse.json({
      success: true,

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
