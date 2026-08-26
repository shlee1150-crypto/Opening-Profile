"use client";

import { useState } from "react";
import Image from "next/image";


/* =========================================================
   유형별 결과 정보
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
          title:
            "적정 규모로 시작하기",

          text:
            "초기 환자 수요에 맞춰 시작하고, 향후 체어 증설이 가능하도록 공간과 동선을 계획하세요.",
        },
        {
          title:
            "꾸준한 환자가 오는 자리 찾기",

          text:
            "단순 유동인구보다 실제 거주인구·배후세대·가족 환자 비중을 확인하는 것이 중요합니다.",
        },
        {
          title:
            "고정비 관리하기",

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
          title:
            "좋은 입지에는 과감하게 투자하기",

          text:
            "좋은 입지는 빠른 성장에 도움이 되지만, 높은 임대료가 예상 매출과 투자비를 감당할 수 있는 수준인지 반드시 확인하세요.",
        },
        {
          title:
            "병원의 차별점 만들기",

          text:
            "디지털 진료·임플란트·심미진료 등 원장님이 잘할 수 있는 핵심 진료 영역을 명확하게 설정하세요.",
        },
        {
          title:
            "초기 마케팅 예산 확보하기",

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
          title:
            "후보지는 최소 2~3곳 비교하기",

          text:
            "한 곳만 보고 결정하지 말고 동일한 기준표를 만들어 여러 후보지를 비교하세요.",
        },
        {
          title:
            "매출보다 수익 보기",

          text:
            "예상 매출뿐 아니라 임대료·인건비·장비비 등 고정비와 초기 투자비를 함께 계산하세요.",
        },
        {
          title:
            "분석에만 머물지 않기",

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
          title:
            "개발 예정과 실제 개발 구분하기",

          text:
            "계획 발표만 확인하지 말고 실제 착공 여부와 공사 일정, 입주 일정을 함께 확인하세요.",
        },
        {
          title:
            "입주율 확인하기",

          text:
            "계획 세대수가 많더라도 실제 거주자가 적으면 초기 환자 확보에 예상보다 긴 시간이 걸릴 수 있습니다.",
        },
        {
          title:
            "버틸 수 있는 기간 계산하기",

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
   질문
========================================================= */

const QUESTIONS = [
  {
    id: 1,
    weight: 2,
    question: "개원할 때 가장 중요하게 생각하는 것은?",
    options: [
      {
        type: "analytical",
        text: "인구·경쟁·매출 등 객관적인 데이터",
      },
      {
        type: "stable",
        text: "꾸준히 환자가 찾아오는 안정적인 상권",
      },
      {
        type: "pioneer",
        text: "앞으로 크게 성장할 가능성이 있는 지역",
      },
      {
        type: "aggressive",
        text: "높은 매출을 기대할 수 있는 좋은 상권",
      },
    ],
  },

  {
    id: 2,
    weight: 1,
    question:
      "원장님이 생각하는 ‘잘 운영되는 병원’에 가까운 모습은?",
    options: [
      {
        type: "stable",
        text: "직원과 환자가 편안하게 오래 함께하는 병원",
      },
      {
        type: "analytical",
        text: "시스템이 잘 갖춰져 효율적으로 운영되는 병원",
      },
      {
        type: "aggressive",
        text: "목표를 세우고 빠르게 성과를 만들어 가는 병원",
      },
      {
        type: "pioneer",
        text: "변화하는 환경에 맞춰 계속 발전하는 병원",
      },
    ],
  },

  {
    id: 3,
    weight: 2,
    question: "경쟁 치과가 이미 많은 지역이라면?",
    options: [
      {
        type: "pioneer",
        text: "경쟁이 더 생기기 전에 새로운 지역을 선점한다",
      },
      {
        type: "aggressive",
        text: "수요가 많다는 뜻이니 도전한다",
      },
      {
        type: "stable",
        text: "경쟁이 적은 다른 지역을 찾아본다",
      },
      {
        type: "analytical",
        text: "경쟁 치과의 규모와 환자 수 등을 분석해본다",
      },
    ],
  },

  {
    id: 4,
    weight: 2,
    question: "개원 비용이 예상보다 5천만 원 늘어난다면?",
    options: [
      {
        type: "analytical",
        text: "추가 투자 대비 예상 수익을 계산해본다",
      },
      {
        type: "pioneer",
        text: "미래 성장 가능성이 높다면 투자한다",
      },
      {
        type: "stable",
        text: "꼭 필요한 부분만 남기고 비용을 줄인다",
      },
      {
        type: "aggressive",
        text: "좋은 입지를 위해서라면 추가 투자한다",
      },
    ],
  },

  {
    id: 5,
    weight: 1,
    question:
      "개원 후 생각보다 환자가 빨리 늘어난다면, 원장님은 어떻게 하실 것 같나요?",
    options: [
      {
        type: "aggressive",
        text: "이 기세를 놓치지 않고 더 적극적으로 확장해본다.",
      },
      {
        type: "stable",
        text: "지금의 좋은 흐름을 꾸준히 유지하는 데 집중한다.",
      },
      {
        type: "pioneer",
        text: "앞으로 더 커질 가능성을 생각하며 다음 기회를 준비한다.",
      },
      {
        type: "analytical",
        text: "어떤 요인이 좋은 결과를 만들었는지 먼저 살펴본다.",
      },
    ],
  },

  {
    id: 6,
    weight: 2,
    question: "개원 전 상권분석 자료를 받았다면?",
    options: [
      {
        type: "pioneer",
        text: "현재보다 향후 3~5년의 지역 변화를 본다",
      },
      {
        type: "analytical",
        text: "인구·연령·소득·경쟁·유동인구를 꼼꼼히 분석한다",
      },
      {
        type: "stable",
        text: "주변에 실제 환자가 얼마나 있는지 먼저 본다",
      },
      {
        type: "aggressive",
        text: "예상 매출과 상권 규모를 먼저 본다",
      },
    ],
  },

  {
    id: 7,
    weight: 2,
    question: "다음 중 더 끌리는 개원 방식은?",
    options: [
      {
        type: "stable",
        text: "작지만 안정적인 규모로 시작한다.",
      },
      {
        type: "pioneer",
        text: "성장 가능성이 큰 지역에서 먼저 시작한다.",
      },
      {
        type: "aggressive",
        text: "처음부터 규모 있게 시작해 빠르게 성장한다.",
      },
      {
        type: "analytical",
        text: "데이터를 바탕으로 적정 규모를 결정한다.",
      },
    ],
  },

  {
    id: 8,
    weight: 2,
    question: "원장님이 가장 중요하게 생각하는 개원의 모습은?",
    options: [
      {
        type: "analytical",
        text: "투자 대비 효율적인 수익을 내는 치과",
      },
      {
        type: "aggressive",
        text: "높은 매출과 빠른 성장을 이루는 치과",
      },
      {
        type: "pioneer",
        text: "지역의 성장과 함께 커지는 치과",
      },
      {
        type: "stable",
        text: "한 지역에서 오래 사랑받는 치과",
      },
    ],
  },
];


const TIEBREAKER_OPTIONS = {
  stable: "안정적인 배후수요와 낮은 운영 부담",
  aggressive: "높은 예상매출과 빠른 성장 가능성",
  analytical: "수치로 검증된 투자 대비 수익성",
  pioneer: "향후 개발계획과 선점 가능성",
};


const INITIAL_SCORES = {
  stable: 0,
  aggressive: 0,
  analytical: 0,
  pioneer: 0,
};


/* =========================================================
   상세 분석 리포트
========================================================= */

function DetailedReport({
  info,
  resultEmail,
  setResultEmail,
  emailSending,
  emailError,
  emailSuccess,
  setEmailError,
  setEmailSuccess,
  sendResultEmail,
}) {
  const detail = info.detail;

  return (
    <div className="detail-report">

      <div className="detail-report-header">
        <p>DETAILED OPENING REPORT</p>

        <h2>
          {info.emoji} {info.label} 상세 분석
        </h2>

        <span>
          원장님의 개원 성향을 실제 입지·투자·운영 관점에서
          조금 더 구체적으로 정리했습니다.
        </span>
      </div>


      {/* 성향 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon">01</span>

          <div>
            <small>PROFILE</small>
            <h3>원장님의 성향</h3>
          </div>
        </div>

        <p className="detail-main-text">
          {detail.trait}
        </p>
      </section>


      {/* 추천 입지 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon">02</span>

          <div>
            <small>LOCATION</small>
            <h3>추천 입지</h3>
          </div>
        </div>

        <div className="detail-highlight">
          📍 {detail.locationTitle}
        </div>

        <p className="detail-main-text">
          {detail.locationDescription}
        </p>

        <div className="detail-tags">
          {detail.locationPoints.map((point) => (
            <span key={point}>
              {point}
            </span>
          ))}
        </div>
      </section>


      {/* 추천 전략 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon">03</span>

          <div>
            <small>STRATEGY</small>
            <h3>추천 개원전략</h3>
          </div>
        </div>

        <div className="strategy-title">
          “{detail.strategyTitle}”
        </div>

        <p className="detail-main-text">
          {detail.strategy}
        </p>
      </section>


      {/* 개원 꿀팁 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon">04</span>

          <div>
            <small>OPENING TIP</small>
            <h3>개원 꿀팁</h3>
          </div>
        </div>

        <div className="tip-list">
          {detail.tips.map((tip, index) => (
            <div
              className="tip-item"
              key={tip.title}
            >
              <div className="tip-number">
                {index + 1}
              </div>

              <div>
                <strong>
                  {tip.title}
                </strong>

                <p>
                  {tip.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 홍보 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon">05</span>

          <div>
            <small>OPERATION & MARKETING</small>
            <h3>운영·홍보 포인트</h3>
          </div>
        </div>

        <div className="promotion-title">
          “{detail.promotionTitle}”
        </div>

        <ul className="promotion-list">
          {detail.promotionPoints.map((point) => (
            <li key={point}>
              {point}
            </li>
          ))}
        </ul>

        <p className="detail-main-text">
          {detail.promotionDescription}
        </p>
      </section>


      {/* 주의사항 */}

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-icon warning">
            !
          </span>

          <div>
            <small>CHECK POINT</small>
            <h3>주의할 점</h3>
          </div>
        </div>

        <div className="caution-box">
          {detail.caution}
        </div>
      </section>


      {/* 한 줄 TIP */}

      <div className="one-line-tip">
        <span>ONE LINE TIP</span>

        <strong>
          “{detail.oneLineTip}”
        </strong>
      </div>


      {/* 이메일 */}

      <section className="detail-email">
        <div className="detail-email-head">
          <span>📧</span>

          <div>
            <h3>결과 이메일로 받기</h3>

            <p>
              지금 확인한 상세 진단 결과를 이메일로 받아보세요.
            </p>
          </div>
        </div>

        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="이메일 주소를 입력해주세요"
          value={resultEmail}
          disabled={emailSending}
          onChange={(event) => {
            setResultEmail(event.target.value);
            setEmailError("");
            setEmailSuccess("");
          }}
        />

        {emailError && (
          <div className="detail-email-error">
            {emailError}
          </div>
        )}

        {emailSuccess && (
          <div className="detail-email-success">
            ✓ {emailSuccess}
          </div>
        )}

        <button
          type="button"
          disabled={emailSending}
          onClick={sendResultEmail}
        >
          {emailSending
            ? "이메일 발송 중..."
            : "📧 상세 결과 이메일로 받기"}
        </button>

        <p className="email-privacy-note">
          입력한 이메일 주소는 결과 발송에만 사용되며
          진단 DB에는 별도로 저장하지 않습니다.
        </p>
      </section>


      <style jsx>{`
        .detail-report {
          margin-top: 18px;
          border: 1px solid #ddd6ce;
          border-radius: 22px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 12px 35px rgba(70, 50, 35, 0.08);
        }

        .detail-report-header {
          padding: clamp(25px, 4vw, 38px);
          background: linear-gradient(
            145deg,
            #fff8f3 0%,
            #ffffff 100%
          );
          border-bottom: 1px solid #eee6de;
        }

        .detail-report-header > p {
          margin: 0 0 9px;
          color: #f26a21;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .detail-report-header h2 {
          margin: 0 0 10px;
          color: #28231f;
          font-size: clamp(23px, 4vw, 31px);
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .detail-report-header > span {
          display: block;
          color: #777069;
          font-size: clamp(13px, 2vw, 15px);
          line-height: 1.7;
          word-break: keep-all;
        }

        .detail-section {
          padding: clamp(24px, 4vw, 32px);
          border-bottom: 1px solid #eee8e1;
        }

        .detail-section-title {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 19px;
        }

        .detail-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 10px;
          background: #fff1e8;
          color: #f26a21;
          font-size: 12px;
          font-weight: 900;
        }

        .detail-icon.warning {
          background: #fff0ed;
          color: #dc4c36;
          font-size: 18px;
        }

        .detail-section-title small {
          display: block;
          margin-bottom: 2px;
          color: #aaa29a;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .detail-section-title h3 {
          margin: 0;
          color: #332e29;
          font-size: clamp(17px, 3vw, 20px);
          font-weight: 900;
        }

        .detail-main-text {
          margin: 0;
          color: #5f5851;
          font-size: clamp(14px, 2.3vw, 16px);
          line-height: 1.8;
          word-break: keep-all;
        }

        .detail-highlight {
          margin-bottom: 12px;
          color: #f26a21;
          font-size: clamp(16px, 2.8vw, 19px);
          font-weight: 900;
          line-height: 1.5;
          word-break: keep-all;
        }

        .detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 17px;
        }

        .detail-tags span {
          padding: 8px 11px;
          border-radius: 999px;
          background: #f7f4f0;
          color: #665f58;
          font-size: clamp(11px, 2vw, 13px);
          font-weight: 700;
        }

        .strategy-title {
          margin-bottom: 12px;
          color: #33302c;
          font-size: clamp(17px, 3vw, 20px);
          font-weight: 900;
          line-height: 1.5;
          word-break: keep-all;
        }

        .tip-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .tip-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          border-radius: 50%;
          background: #f26a21;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .tip-item strong {
          display: block;
          margin-bottom: 5px;
          color: #3c3732;
          font-size: clamp(14px, 2.3vw, 16px);
          font-weight: 900;
        }

        .tip-item p {
          margin: 0;
          color: #746d66;
          font-size: clamp(13px, 2vw, 15px);
          line-height: 1.7;
          word-break: keep-all;
        }

        .promotion-title {
          margin-bottom: 16px;
          color: #33302c;
          font-size: clamp(16px, 2.8vw, 19px);
          line-height: 1.55;
          font-weight: 900;
          word-break: keep-all;
        }

        .promotion-list {
          margin: 0 0 17px;
          padding: 17px 18px 17px 37px;
          border-radius: 14px;
          background: #f8f6f3;
          color: #5d5650;
        }

        .promotion-list li {
          margin-bottom: 8px;
          font-size: clamp(13px, 2.1vw, 15px);
          line-height: 1.6;
        }

        .promotion-list li:last-child {
          margin-bottom: 0;
        }

        .caution-box {
          padding: 17px 18px;
          border-radius: 14px;
          background: #fff5f2;
          border-left: 4px solid #e6654d;
          color: #67534d;
          font-size: clamp(13px, 2.2vw, 15px);
          line-height: 1.75;
          word-break: keep-all;
        }

        .one-line-tip {
          padding: clamp(24px, 4vw, 31px);
          background: #332d28;
          text-align: center;
        }

        .one-line-tip span {
          display: block;
          margin-bottom: 9px;
          color: #f8a16e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .one-line-tip strong {
          display: block;
          color: #ffffff;
          font-size: clamp(16px, 3vw, 20px);
          line-height: 1.6;
          font-weight: 900;
          word-break: keep-all;
        }

        .detail-email {
          padding: clamp(25px, 4vw, 33px);
          background: #f8f5f1;
        }

        .detail-email-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .detail-email-head > span {
          font-size: 23px;
        }

        .detail-email-head h3 {
          margin: 0 0 5px;
          color: #332f2b;
          font-size: clamp(17px, 3vw, 20px);
          font-weight: 900;
        }

        .detail-email-head p {
          margin: 0;
          color: #777069;
          font-size: 13px;
          line-height: 1.6;
        }

        .detail-email input {
          width: 100%;
          height: 56px;
          padding: 0 16px;
          border: 1px solid #d9d1ca;
          border-radius: 13px;
          outline: none;
          background: #ffffff;
          color: #222222;
          font-size: 16px;
          font-weight: 600;
        }

        .detail-email input:focus {
          border-color: #f26a21;
          box-shadow: 0 0 0 3px rgba(242, 106, 33, 0.1);
        }

        .detail-email button {
          width: 100%;
          height: 56px;
          margin-top: 13px;
          border: 0;
          border-radius: 14px;
          background: #f26a21;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(242, 106, 33, 0.2);
        }

        .detail-email button:disabled {
          background: #c9c3bd;
          box-shadow: none;
          cursor: default;
        }

        .detail-email-error,
        .detail-email-success {
          margin-top: 11px;
          padding: 11px 13px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
        }

        .detail-email-error {
          background: #fff0eb;
          color: #d4512c;
        }

        .detail-email-success {
          background: #eef8ee;
          color: #317b3a;
        }

        .email-privacy-note {
          margin: 11px 0 0;
          color: #99918a;
          font-size: 11px;
          line-height: 1.55;
          text-align: center;
          word-break: keep-all;
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   메인
========================================================= */

export default function Home() {
  const [stage, setStage] = useState("cover");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [responseId, setResponseId] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [selectedType, setSelectedType] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [tieTypes, setTieTypes] = useState([]);

  const [finalResult, setFinalResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [resultEmail, setResultEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");


  /* =========================================================
     전화번호 자동 하이픈
  ========================================================= */

  const handlePhoneChange = (event) => {
    let value = event.target.value.replace(/[^0-9]/g, "");

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    if (value.length <= 3) {
      setPhone(value);
      return;
    }

    if (value.length <= 7) {
      setPhone(
        `${value.slice(0, 3)}-${value.slice(3)}`
      );
      return;
    }

    setPhone(
      `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`
    );
  };


  /* =========================================================
     개인정보 저장
  ========================================================= */

  const startSurvey = async () => {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("휴대폰 번호를 입력해주세요.");
      return;
    }

    if (
      phone.replace(/[^0-9]/g, "").length !== 11
    ) {
      setErrorMessage(
        "휴대폰 번호를 정확하게 입력해주세요."
      );
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMessage("면허번호를 입력해주세요.");
      return;
    }

    if (!privacyConsent) {
      setErrorMessage(
        "개인정보 수집 및 이용에 동의해주세요."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/diagnosis/start",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            phone,
            licenseNumber,
            privacyConsent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "정보 저장에 실패했습니다."
        );
      }

      setResponseId(result.responseId);
      setStage("survey");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message ||
          "정보 저장 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     일반 질문
  ========================================================= */

  const selectAnswer = (option) => {
    if (transitioning) {
      return;
    }

    const question =
      QUESTIONS[currentQuestion];

    const answerKey =
      `q${question.id}`;

    const nextAnswers = {
      ...answers,

      [answerKey]: {
        question: question.question,
        answer: option.text,
        type: option.type,
        typeLabel:
          TYPE_INFO[option.type].label,
        score: question.weight,
      },
    };

    const nextScores = {
      ...scores,

      [option.type]:
        scores[option.type] +
        question.weight,
    };

    setAnswers(nextAnswers);
    setScores(nextScores);

    setSelectedType(option.type);
    setTransitioning(true);

    setTimeout(() => {
      setSelectedType(null);
      setTransitioning(false);

      if (
        currentQuestion <
        QUESTIONS.length - 1
      ) {
        setCurrentQuestion(
          currentQuestion + 1
        );

        return;
      }

      evaluateMainResult(
        nextAnswers,
        nextScores
      );
    }, 380);
  };


  /* =========================================================
     결과 판정
  ========================================================= */

  const evaluateMainResult = (
    finalAnswers,
    finalScores
  ) => {
    const highest =
      Math.max(
        ...Object.values(finalScores)
      );

    const highestTypes =
      Object.keys(finalScores).filter(
        (type) =>
          finalScores[type] === highest
      );

    if (highestTypes.length > 1) {
      setTieTypes(highestTypes);
      setAnswers(finalAnswers);
      setScores(finalScores);
      setStage("tiebreaker");

      return;
    }

    completeDiagnosis(
      highestTypes[0],
      finalAnswers,
      finalScores
    );
  };


  /* =========================================================
     동점 판별
  ========================================================= */

  const selectTiebreaker = (type) => {
    if (transitioning) {
      return;
    }

    setSelectedType(type);
    setTransitioning(true);

    const tieAnswers = {
      ...answers,

      tiebreaker: {
        question:
          "개원 여부를 최종 결정할 때 가장 큰 확신을 주는 것은 무엇인가요?",

        answer:
          TIEBREAKER_OPTIONS[type],

        type,

        typeLabel:
          TYPE_INFO[type].label,

        score: 0,
      },
    };

    setTimeout(() => {
      setSelectedType(null);
      setTransitioning(false);

      completeDiagnosis(
        type,
        tieAnswers,
        scores
      );
    }, 380);
  };


  /* =========================================================
     결과 저장
  ========================================================= */

  const completeDiagnosis = async (
    primaryType,
    finalAnswers,
    finalScores
  ) => {
    setStage("analyzing");
    setSaveError("");
    setDetailsOpen(false);

    const sorted =
      Object.entries(finalScores).sort(
        (a, b) => b[1] - a[1]
      );

    const secondaryEntry =
      sorted.find(
        ([type]) =>
          type !== primaryType
      );

    const result = {
      primaryType,

      primaryLabel:
        TYPE_INFO[primaryType].label,

      primaryScore:
        finalScores[primaryType],

      secondaryType:
        secondaryEntry
          ? secondaryEntry[0]
          : null,

      secondaryLabel:
        secondaryEntry
          ? TYPE_INFO[
              secondaryEntry[0]
            ].label
          : null,

      secondaryScore:
        secondaryEntry
          ? secondaryEntry[1]
          : null,

      scores: finalScores,
    };

    setFinalResult(result);

    try {
      const [response] =
        await Promise.all([
          fetch(
            "/api/diagnosis/complete",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                responseId,

                answers:
                  finalAnswers,

                typeScores:
                  finalScores,

                resultType:
                  result.primaryLabel,

                resultScore:
                  result.primaryScore,

                secondaryType:
                  result.secondaryLabel,

                secondaryScore:
                  result.secondaryScore,
              }),
            }
          ),

          new Promise((resolve) =>
            setTimeout(resolve, 1400)
          ),
        ]);

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "결과 저장에 실패했습니다."
        );
      }
    } catch (error) {
      console.error(error);

      setSaveError(
        "진단 결과 저장 중 오류가 발생했습니다."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );
    }

    setStage("result");
  };


  /* =========================================================
     이메일 발송
  ========================================================= */

  const sendResultEmail = async () => {
    setEmailError("");
    setEmailSuccess("");

    const email =
      resultEmail.trim().toLowerCase();

    if (!email) {
      setEmailError(
        "이메일 주소를 입력해주세요."
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setEmailError(
        "이메일 주소를 정확하게 입력해주세요."
      );
      return;
    }

    if (!responseId) {
      setEmailError(
        "진단 정보가 확인되지 않습니다."
      );
      return;
    }

    try {
      setEmailSending(true);

      const response =
        await fetch(
          "/api/result/send-email",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              responseId,
              email,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "이메일 발송에 실패했습니다."
        );
      }

      setEmailSuccess(
        "상세 진단 결과를 이메일로 보내드렸습니다."
      );
    } catch (error) {
      console.error(error);

      setEmailError(
        error.message ||
          "이메일 발송 중 오류가 발생했습니다."
      );
    } finally {
      setEmailSending(false);
    }
  };


  /* =========================================================
     다시 진단
  ========================================================= */

  const restartDiagnosis = () => {
    setStage("cover");

    setName("");
    setPhone("");
    setLicenseNumber("");
    setPrivacyConsent(false);

    setResponseId(null);

    setCurrentQuestion(0);
    setAnswers({});
    setScores({
      ...INITIAL_SCORES,
    });

    setSelectedType(null);
    setTransitioning(false);
    setTieTypes([]);

    setFinalResult(null);

    setErrorMessage("");
    setSaveError("");

    setDetailsOpen(false);

    setResultEmail("");
    setEmailSending(false);
    setEmailError("");
    setEmailSuccess("");
  };


  const question =
    QUESTIONS[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      QUESTIONS.length) *
    100;


  return (
    <main className="app">

      {/* =====================================================
          표지
      ===================================================== */}

      <section
        className={`screen cover-screen ${
          stage !== "cover"
            ? "hide-screen"
            : ""
        }`}
      >
        <div className="cover-container">

          <Image
            src="/cover.png"
            alt="오스템임플란트 개원성향진단"
            fill
            priority
            sizes="(max-width: 1100px) 100vw, 520px"
            className="cover-image"
          />

          <div className="start-button-area">

            <button
              type="button"
              className="cover-start-button"
              onClick={() =>
                setStage("info")
              }
            >
              진단 시작하기
            </button>

          </div>

        </div>
      </section>


      {/* =====================================================
          개인정보
      ===================================================== */}

      <section
        className={`screen info-screen ${
          stage === "info"
            ? "show-screen"
            : ""
        } ${
          stage !== "cover" &&
          stage !== "info"
            ? "hide-info-screen"
            : ""
        }`}
      >
        <div className="info-container">

          <div className="info-top">

            <p className="info-label">
              OPENING PROFILE
            </p>

            <h1>
              개원성향진단
            </h1>

            <p className="info-description">
              진단을 시작하기 전
              <br />
              기본 정보를 입력해주세요.
            </p>

          </div>


          <div className="form-area">

            <div className="form-group">
              <label htmlFor="name">
                이름
              </label>

              <input
                id="name"
                type="text"
                placeholder="이름을 입력해주세요"
                value={name}
                autoComplete="name"
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
              />
            </div>


            <div className="form-group">
              <label htmlFor="phone">
                휴대폰 번호
              </label>

              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="010-0000-0000"
                value={phone}
                autoComplete="tel"
                onChange={
                  handlePhoneChange
                }
              />
            </div>


            <div className="form-group">
              <label htmlFor="license">
                면허번호
              </label>

              <input
                id="license"
                type="text"
                inputMode="numeric"
                placeholder="면허번호를 입력해주세요"
                value={licenseNumber}
                onChange={(event) =>
                  setLicenseNumber(
                    event.target.value.replace(
                      /[^0-9]/g,
                      ""
                    )
                  )
                }
              />
            </div>


            <div className="privacy-box">

              <div className="privacy-title">
                개인정보 수집 및 이용 안내
              </div>

              <p>
                <strong>
                  수집 항목
                </strong>

                <br />

                이름, 휴대폰번호,
                면허번호
              </p>

              <p>
                <strong>
                  수집 목적
                </strong>

                <br />

                개원성향진단 진행
                및 결과 관리
              </p>

              <p>
                <strong>
                  보유 및 이용기간
                </strong>

                <br />

                사내 개인정보
                처리 기준에 따라
                별도 고지
              </p>

              <p className="privacy-notice">
                개인정보 수집 및 이용에 대한
                동의를 거부할 수 있으며,
                동의하지 않을 경우 진단 서비스
                이용이 제한될 수 있습니다.
              </p>

            </div>


            <label className="consent-row">

              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(event) =>
                  setPrivacyConsent(
                    event.target.checked
                  )
                }
              />

              <span className="custom-check" />

              <span>
                개인정보 수집 및 이용에 동의합니다.
              </span>

            </label>


            {errorMessage && (
              <div className="form-error">
                {errorMessage}
              </div>
            )}


            <button
              type="button"
              className="info-submit-button"
              disabled={loading}
              onClick={startSurvey}
            >
              {loading
                ? "정보 저장 중..."
                : "동의하고 진단 시작"}
            </button>

          </div>
        </div>
      </section>


      {/* =====================================================
          설문
      ===================================================== */}

      <section
        className={`screen survey-screen ${
          stage === "survey"
            ? "show-screen"
            : ""
        }`}
      >
        <div className="survey-container">

          <div className="survey-header">

            <span>
              개원성향진단
            </span>

            <span>
              {String(
                currentQuestion + 1
              ).padStart(2, "0")}
              {" / "}
              {String(
                QUESTIONS.length
              ).padStart(2, "0")}
            </span>

          </div>


          <div className="progress">

            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>


          <div
            key={question.id}
            className={`question-card ${
              transitioning
                ? "question-leaving"
                : ""
            }`}
          >
            <p className="question-number">
              QUESTION{" "}
              {String(
                question.id
              ).padStart(2, "0")}
            </p>

            <h2>
              {question.question}
            </h2>

            <div className="answers">

              {question.options.map(
                (option, index) => (
                  <button
                    key={`${question.id}-${option.type}`}
                    type="button"
                    disabled={transitioning}
                    className={
                      selectedType ===
                      option.type
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      selectAnswer(
                        option
                      )
                    }
                  >
                    <span className="option-number">
                      {index + 1}
                    </span>

                    <span className="option-text">
                      {option.text}
                    </span>
                  </button>
                )
              )}

            </div>
          </div>

        </div>
      </section>


      {/* =====================================================
          동점 판별
      ===================================================== */}

      <section
        className={`screen survey-screen ${
          stage === "tiebreaker"
            ? "show-screen"
            : ""
        }`}
      >
        <div className="survey-container">

          <div className="survey-header">
            <span>
              개원성향진단
            </span>

            <span>
              FINAL
            </span>
          </div>


          <div className="progress">
            <div
              className="progress-bar"
              style={{
                width: "100%",
              }}
            />
          </div>


          <div
            className={`question-card ${
              transitioning
                ? "question-leaving"
                : ""
            }`}
          >
            <p className="question-number">
              FINAL QUESTION
            </p>

            <h2>
              개원 여부를 최종
              결정할 때 가장 큰
              확신을 주는 것은
              무엇인가요?
            </h2>

            <p className="tie-description">
              두 가지 성향의 점수가
              비슷하여 마지막 질문을
              드립니다.
            </p>


            <div className="answers">

              {tieTypes.map(
                (type, index) => (
                  <button
                    key={type}
                    type="button"
                    disabled={transitioning}
                    className={
                      selectedType ===
                      type
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      selectTiebreaker(
                        type
                      )
                    }
                  >
                    <span className="option-number">
                      {index + 1}
                    </span>

                    <span className="option-text">
                      {
                        TIEBREAKER_OPTIONS[
                          type
                        ]
                      }
                    </span>
                  </button>
                )
              )}

            </div>
          </div>

        </div>
      </section>


      {/* =====================================================
          분석중
      ===================================================== */}

      <section
        className={`screen analyzing-screen ${
          stage === "analyzing"
            ? "show-analyzing"
            : ""
        }`}
      >
        <div className="analyzing-content">

          <div className="analysis-icon">
            🦷
          </div>

          <p className="analysis-small">
            OPENING PROFILE
          </p>

          <h2>
            원장님의 개원성향을
            <br />
            분석하고 있습니다.
          </h2>

          <div className="analysis-dots">
            <span />
            <span />
            <span />
          </div>

        </div>
      </section>


      {/* =====================================================
          결과
      ===================================================== */}

      <section
        className={`screen result-screen ${
          stage === "result"
            ? "show-result"
            : ""
        }`}
      >
        {finalResult && (
          <div className="result-container">

            {/* 기존 결과 */}

            <div className="result-top">

              <p className="result-small">
                YOUR OPENING PROFILE
              </p>

              <p className="result-intro">
                원장님의 개원 성향은
              </p>

              <div className="result-type">

                <span className="result-emoji">
                  {
                    TYPE_INFO[
                      finalResult.primaryType
                    ].emoji
                  }
                </span>

                <h1>
                  {finalResult.primaryLabel}
                </h1>

              </div>

              <h2 className="result-title">
                {
                  TYPE_INFO[
                    finalResult.primaryType
                  ].title
                }
              </h2>

              <p className="result-description">
                {
                  TYPE_INFO[
                    finalResult.primaryType
                  ].description
                }
              </p>

            </div>


            <div className="result-recommendation">

              <span>
                💡 추천 개원 방향
              </span>

              <p>
                {
                  TYPE_INFO[
                    finalResult.primaryType
                  ].recommendation
                }
              </p>

            </div>


            {finalResult.secondaryType && (
              <div className="secondary-result">

                <span>
                  함께 나타난 보조 성향
                </span>

                <strong>
                  {
                    TYPE_INFO[
                      finalResult.secondaryType
                    ].emoji
                  }
                  {" "}
                  {finalResult.secondaryLabel}
                </strong>

                <p>
                  주 성향과 함께{" "}
                  {finalResult.secondaryLabel}{" "}
                  성향도 나타났습니다.
                </p>

              </div>
            )}


            <div className="score-card">

              <h3>
                개원성향 분석
              </h3>

              {Object.entries(
                TYPE_INFO
              ).map(
                ([type, info]) => {
                  const score =
                    finalResult.scores[
                      type
                    ];

                  const percentage =
                    Math.min(
                      100,
                      Math.round(
                        (score / 14) *
                          100
                      )
                    );

                  return (
                    <div
                      className="score-row"
                      key={type}
                    >
                      <div className="score-label">

                        <span>
                          {info.emoji}{" "}
                          {info.label}
                        </span>

                        <strong>
                          {score}점
                        </strong>

                      </div>

                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />
                      </div>

                    </div>
                  );
                }
              )}

            </div>


            {saveError && (
              <div className="result-save-error">
                {saveError}
              </div>
            )}


            {/* 자세히 보기 */}

            <button
              type="button"
              onClick={() =>
                setDetailsOpen(
                  (previous) =>
                    !previous
                )
              }
              style={{
                width: "100%",
                height: "58px",
                marginTop: "24px",
                border:
                  detailsOpen
                    ? "0"
                    : "1.5px solid #f26a21",
                borderRadius: "15px",
                background:
                  detailsOpen
                    ? "#332d28"
                    : "#fff8f3",
                color:
                  detailsOpen
                    ? "#ffffff"
                    : "#f26a21",
                fontSize: "16px",
                fontWeight: "900",
                cursor: "pointer",
                transition:
                  "all 0.3s ease",
              }}
            >
              {detailsOpen
                ? "▲ 상세 분석 접기"
                : "🔍 자세히 보기"}
            </button>


            {/* 부드러운 상세 분석 펼침 */}

            <div
              style={{
                maxHeight:
                  detailsOpen
                    ? "9000px"
                    : "0px",

                opacity:
                  detailsOpen
                    ? 1
                    : 0,

                transform:
                  detailsOpen
                    ? "translateY(0)"
                    : "translateY(-12px)",

                marginTop:
                  detailsOpen
                    ? "18px"
                    : "0px",

                overflow: "hidden",

                pointerEvents:
                  detailsOpen
                    ? "auto"
                    : "none",

                transition:
                  "max-height 1.15s cubic-bezier(0.22, 1, 0.36, 1), " +
                  "opacity 0.5s ease, " +
                  "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), " +
                  "margin-top 0.45s ease",
              }}
            >
              <DetailedReport
                info={
                  TYPE_INFO[
                    finalResult.primaryType
                  ]
                }
                resultEmail={
                  resultEmail
                }
                setResultEmail={
                  setResultEmail
                }
                emailSending={
                  emailSending
                }
                emailError={
                  emailError
                }
                emailSuccess={
                  emailSuccess
                }
                setEmailError={
                  setEmailError
                }
                setEmailSuccess={
                  setEmailSuccess
                }
                sendResultEmail={
                  sendResultEmail
                }
              />
            </div>


            <button
              type="button"
              className="restart-button"
              onClick={
                restartDiagnosis
              }
              style={{
                marginTop:
                  detailsOpen
                    ? "18px"
                    : "14px",
              }}
            >
              다시 진단하기
            </button>

          </div>
        )}
      </section>

    </main>
  );
}
