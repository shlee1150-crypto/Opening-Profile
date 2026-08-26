"use client";

import {
  useRef,
  useState,
} from "react";

import Image from "next/image";

import {
  TYPE_INFO,
  QUESTIONS,
  TIEBREAKER_OPTIONS,
  INITIAL_SCORES,
  TOTAL_SCORE,
  getCombinationInfo,
  getCombinationStrength,
} from "./lib/diagnosisData";


/* =========================================================
   보조성향 선택

   1. 메인 제외 최고 점수
   2. 동점이면 해당 유형을 선택한 문항 수
   3. 그래도 동점이면 뒤쪽 문항에서 나타난 유형 우선

   완전히 임의의 Object 순서로 정해지는 것을 방지
========================================================= */

function selectSecondaryType(
  primaryType,
  scores,
  answers
) {
  const candidates =
    Object.entries(scores)
      .filter(
        ([type]) =>
          type !== primaryType
      );

  const highestSecondaryScore =
    Math.max(
      ...candidates.map(
        ([, score]) =>
          score
      )
    );

  const tiedCandidates =
    candidates
      .filter(
        ([, score]) =>
          score ===
          highestSecondaryScore
      )
      .map(
        ([type]) =>
          type
      );

  if (
    tiedCandidates.length === 1
  ) {
    return tiedCandidates[0];
  }


  const answerValues =
    Object.entries(answers)
      .filter(
        ([key]) =>
          key.startsWith("q")
      );


  const ranked =
    tiedCandidates.map(
      (type) => {

        const selectedAnswers =
          answerValues.filter(
            ([, answer]) =>
              answer.type === type
          );

        const lastQuestion =
          selectedAnswers.reduce(
            (
              highest,
              [key]
            ) => {

              const number =
                Number(
                  key.replace(
                    "q",
                    ""
                  )
                ) || 0;

              return Math.max(
                highest,
                number
              );
            },
            0
          );

        return {
          type,

          count:
            selectedAnswers.length,

          lastQuestion,
        };
      }
    );


  ranked.sort(
    (a, b) => {

      if (
        b.count !==
        a.count
      ) {
        return (
          b.count -
          a.count
        );
      }

      return (
        b.lastQuestion -
        a.lastQuestion
      );
    }
  );


  return ranked[0].type;
}


/* =========================================================
   상세 결과 리포트
========================================================= */

function DetailedReport({
  primaryInfo,
  secondaryInfo,
  combination,
  combinationStrength,

  resultEmail,
  setResultEmail,

  emailSending,
  emailError,
  emailSuccess,

  setEmailError,
  setEmailSuccess,

  sendResultEmail,
}) {
  const detail =
    primaryInfo.detail;


  return (
    <div className="detail-report">

      {/* ===============================================
          REPORT HEADER
      =============================================== */}

      <div className="detail-report-header">

        <p>
          DETAILED OPENING REPORT
        </p>

        <h2>
          {primaryInfo.emoji}{" "}
          {primaryInfo.label}
          {" × "}
          {secondaryInfo.emoji}{" "}
          {secondaryInfo.label}
        </h2>

        <span>
          기본 성향과 보조 성향을 함께 분석해
          원장님의 개원 의사결정 스타일을
          조금 더 구체적으로 정리했습니다.
        </span>

      </div>


      {/* ===============================================
          00 복합성향
      =============================================== */}

      <section className="detail-section combination-detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            00
          </span>

          <div>
            <small>
              COMBINATION
            </small>

            <h3>
              나의 복합 개원성향
            </h3>
          </div>

        </div>


        <div className="combination-big-name">
          {combination.name}
        </div>


        <div className="combination-strength-badge">
          {combinationStrength.label}
        </div>


        <p className="combination-tagline">
          “{combination.tagline}”
        </p>


        <p className="detail-main-text">
          {combination.description}
        </p>


        <div className="combo-analysis-grid">

          <div className="combo-analysis-box">

            <span className="combo-box-label">
              STRONG POINT
            </span>

            <h4>
              강점
            </h4>

            <ul>
              {combination.strengths.map(
                (item) => (
                  <li key={item}>
                    {item}
                  </li>
                )
              )}
            </ul>

          </div>


          <div className="combo-analysis-box caution">

            <span className="combo-box-label">
              CHECK POINT
            </span>

            <h4>
              주의할 점
            </h4>

            <ul>
              {combination.cautions.map(
                (item) => (
                  <li key={item}>
                    {item}
                  </li>
                )
              )}
            </ul>

          </div>

        </div>


        <div className="combo-strategy">

          <span>
            추천 전략
          </span>

          <strong>
            “{combination.strategy}”
          </strong>

        </div>

      </section>


      {/* ===============================================
          01 기본성향
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            01
          </span>

          <div>

            <small>
              PROFILE
            </small>

            <h3>
              원장님의 기본 성향
            </h3>

          </div>

        </div>


        <p className="detail-main-text">
          {detail.trait}
        </p>

      </section>


      {/* ===============================================
          02 추천입지
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            02
          </span>

          <div>

            <small>
              LOCATION
            </small>

            <h3>
              추천 입지
            </h3>

          </div>

        </div>


        <div className="detail-highlight">
          📍 {detail.locationTitle}
        </div>


        <p className="detail-main-text">
          {detail.locationDescription}
        </p>


        <div className="detail-tags">

          {detail.locationPoints.map(
            (point) => (
              <span key={point}>
                {point}
              </span>
            )
          )}

        </div>

      </section>


      {/* ===============================================
          03 추천전략
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            03
          </span>

          <div>

            <small>
              STRATEGY
            </small>

            <h3>
              추천 개원전략
            </h3>

          </div>

        </div>


        <div className="strategy-title">
          “{detail.strategyTitle}”
        </div>


        <p className="detail-main-text">
          {detail.strategy}
        </p>

      </section>


      {/* ===============================================
          04 개원 꿀팁
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            04
          </span>

          <div>

            <small>
              OPENING TIP
            </small>

            <h3>
              개원 꿀팁
            </h3>

          </div>

        </div>


        <div className="tip-list">

          {detail.tips.map(
            (
              tip,
              index
            ) => (

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

            )
          )}

        </div>

      </section>


      {/* ===============================================
          05 운영 홍보
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon">
            05
          </span>

          <div>

            <small>
              OPERATION & MARKETING
            </small>

            <h3>
              운영·홍보 포인트
            </h3>

          </div>

        </div>


        <div className="promotion-title">
          “{detail.promotionTitle}”
        </div>


        <ul className="promotion-list">

          {detail.promotionPoints.map(
            (point) => (
              <li key={point}>
                {point}
              </li>
            )
          )}

        </ul>


        <p className="detail-main-text">
          {detail.promotionDescription}
        </p>

      </section>


      {/* ===============================================
          주의사항
      =============================================== */}

      <section className="detail-section">

        <div className="detail-section-title">

          <span className="detail-icon warning">
            !
          </span>

          <div>

            <small>
              CHECK POINT
            </small>

            <h3>
              기본 성향에서 주의할 점
            </h3>

          </div>

        </div>


        <div className="caution-box">
          {detail.caution}
        </div>

      </section>


      {/* ===============================================
          한줄 TIP
      =============================================== */}

      <div className="one-line-tip">

        <span>
          ONE LINE TIP
        </span>

        <strong>
          “{detail.oneLineTip}”
        </strong>

      </div>


      {/* ===============================================
          이메일
      =============================================== */}

      <section className="detail-email">

        <div className="detail-email-head">

          <span>
            📧
          </span>

          <div>

            <h3>
              결과 이메일로 받기
            </h3>

            <p>
              지금 확인한 기본성향 + 복합성향
              상세 분석을 이메일로 받아보세요.
            </p>

          </div>

        </div>


        <input
          type="email"

          inputMode="email"

          autoComplete="email"

          placeholder="이메일 주소를 입력해주세요"

          value={
            resultEmail
          }

          disabled={
            emailSending
          }

          onChange={(
            event
          ) => {

            setResultEmail(
              event.target.value
            );

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

          disabled={
            emailSending
          }

          onClick={
            sendResultEmail
          }
        >

          {emailSending
            ? "이메일 발송 중..."
            : "📧 상세 결과 이메일로 받기"}

        </button>


        <p className="email-privacy-note">
          입력한 이메일 주소는 결과 발송에만
          사용되며 진단 DB에는 별도로 저장하지 않습니다.
        </p>

      </section>


      {/* ===================================================
          상세리포트 전용 CSS
      =================================================== */}

      <style jsx>{`

        .detail-report {
          margin-top: 18px;

          border:
            1px solid
            #ddd6ce;

          border-radius:
            22px;

          overflow:
            hidden;

          background:
            #ffffff;

          box-shadow:
            0 12px 35px
            rgba(
              70,
              50,
              35,
              0.08
            );
        }


        .detail-report-header {
          padding:
            clamp(
              25px,
              4vw,
              38px
            );

          background:
            linear-gradient(
              145deg,
              #fff8f3 0%,
              #ffffff 100%
            );

          border-bottom:
            1px solid
            #eee6de;
        }


        .detail-report-header > p {
          margin:
            0 0 9px;

          color:
            #f26a21;

          font-size:
            11px;

          font-weight:
            900;

          letter-spacing:
            1.8px;
        }


        .detail-report-header h2 {
          margin:
            0 0 10px;

          color:
            #28231f;

          font-size:
            clamp(
              23px,
              4vw,
              31px
            );

          line-height:
            1.4;

          font-weight:
            900;

          letter-spacing:
            -1px;

          word-break:
            keep-all;
        }


        .detail-report-header > span {
          display:
            block;

          color:
            #777069;

          font-size:
            clamp(
              13px,
              2vw,
              15px
            );

          line-height:
            1.7;

          word-break:
            keep-all;
        }


        .detail-section {
          padding:
            clamp(
              24px,
              4vw,
              32px
            );

          border-bottom:
            1px solid
            #eee8e1;
        }


        .combination-detail-section {
          background:
            #fffdfb;
        }


        .detail-section-title {
          display:
            flex;

          align-items:
            center;

          gap:
            13px;

          margin-bottom:
            19px;
        }


        .detail-icon {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            36px;

          height:
            36px;

          flex:
            0 0 36px;

          border-radius:
            10px;

          background:
            #fff1e8;

          color:
            #f26a21;

          font-size:
            12px;

          font-weight:
            900;
        }


        .detail-icon.warning {
          background:
            #fff0ed;

          color:
            #dc4c36;

          font-size:
            18px;
        }


        .detail-section-title small {
          display:
            block;

          margin-bottom:
            2px;

          color:
            #aaa29a;

          font-size:
            9px;

          font-weight:
            900;

          letter-spacing:
            1.3px;
        }


        .detail-section-title h3 {
          margin:
            0;

          color:
            #332e29;

          font-size:
            clamp(
              17px,
              3vw,
              20px
            );

          font-weight:
            900;
        }


        .combination-big-name {
          color:
            #26221e;

          font-size:
            clamp(
              28px,
              5vw,
              39px
            );

          font-weight:
            900;

          letter-spacing:
            -1.3px;
        }


        .combination-strength-badge {
          display:
            inline-block;

          margin-top:
            9px;

          padding:
            7px 11px;

          border-radius:
            999px;

          background:
            #fff0e6;

          color:
            #f26a21;

          font-size:
            12px;

          font-weight:
            900;
        }


        .combination-tagline {
          margin:
            18px 0 12px;

          color:
            #3a3530;

          font-size:
            clamp(
              17px,
              3vw,
              20px
            );

          font-weight:
            900;

          line-height:
            1.6;

          word-break:
            keep-all;
        }


        .detail-main-text {
          margin:
            0;

          color:
            #5f5851;

          font-size:
            clamp(
              14px,
              2.3vw,
              16px
            );

          line-height:
            1.8;

          word-break:
            keep-all;
        }


        .combo-analysis-grid {
          display:
            grid;

          grid-template-columns:
            1fr;

          gap:
            12px;

          margin-top:
            23px;
        }


        .combo-analysis-box {
          padding:
            18px;

          border-radius:
            15px;

          background:
            #f8f6f3;
        }


        .combo-analysis-box.caution {
          background:
            #fff5f2;
        }


        .combo-box-label {
          display:
            block;

          margin-bottom:
            5px;

          color:
            #f26a21;

          font-size:
            9px;

          letter-spacing:
            1.3px;

          font-weight:
            900;
        }


        .combo-analysis-box.caution
        .combo-box-label {
          color:
            #d75c47;
        }


        .combo-analysis-box h4 {
          margin:
            0 0 10px;

          color:
            #37322d;

          font-size:
            16px;

          font-weight:
            900;
        }


        .combo-analysis-box ul {
          margin:
            0;

          padding-left:
            19px;

          color:
            #68615a;

          font-size:
            13px;

          line-height:
            1.7;
        }


        .combo-analysis-box li {
          margin-bottom:
            6px;
        }


        .combo-analysis-box li:last-child {
          margin-bottom:
            0;
        }


        .combo-strategy {
          margin-top:
            15px;

          padding:
            18px;

          border-radius:
            15px;

          background:
            #332d28;
        }


        .combo-strategy span {
          display:
            block;

          margin-bottom:
            7px;

          color:
            #f8a16e;

          font-size:
            10px;

          font-weight:
            900;

          letter-spacing:
            1px;
        }


        .combo-strategy strong {
          display:
            block;

          color:
            white;

          font-size:
            clamp(
              15px,
              2.7vw,
              18px
            );

          line-height:
            1.6;

          word-break:
            keep-all;
        }


        .detail-highlight {
          margin-bottom:
            12px;

          color:
            #f26a21;

          font-size:
            clamp(
              16px,
              2.8vw,
              19px
            );

          font-weight:
            900;

          line-height:
            1.5;

          word-break:
            keep-all;
        }


        .detail-tags {
          display:
            flex;

          flex-wrap:
            wrap;

          gap:
            8px;

          margin-top:
            17px;
        }


        .detail-tags span {
          padding:
            8px 11px;

          border-radius:
            999px;

          background:
            #f7f4f0;

          color:
            #665f58;

          font-size:
            clamp(
              11px,
              2vw,
              13px
            );

          font-weight:
            700;
        }


        .strategy-title {
          margin-bottom:
            12px;

          color:
            #33302c;

          font-size:
            clamp(
              17px,
              3vw,
              20px
            );

          font-weight:
            900;

          line-height:
            1.5;

          word-break:
            keep-all;
        }


        .tip-list {
          display:
            flex;

          flex-direction:
            column;

          gap:
            18px;
        }


        .tip-item {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            13px;
        }


        .tip-number {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            28px;

          height:
            28px;

          flex:
            0 0 28px;

          border-radius:
            50%;

          background:
            #f26a21;

          color:
            #ffffff;

          font-size:
            12px;

          font-weight:
            900;
        }


        .tip-item strong {
          display:
            block;

          margin-bottom:
            5px;

          color:
            #3c3732;

          font-size:
            clamp(
              14px,
              2.3vw,
              16px
            );

          font-weight:
            900;
        }


        .tip-item p {
          margin:
            0;

          color:
            #746d66;

          font-size:
            clamp(
              13px,
              2vw,
              15px
            );

          line-height:
            1.7;

          word-break:
            keep-all;
        }


        .promotion-title {
          margin-bottom:
            16px;

          color:
            #33302c;

          font-size:
            clamp(
              16px,
              2.8vw,
              19px
            );

          line-height:
            1.55;

          font-weight:
            900;

          word-break:
            keep-all;
        }


        .promotion-list {
          margin:
            0 0 17px;

          padding:
            17px
            18px
            17px
            37px;

          border-radius:
            14px;

          background:
            #f8f6f3;

          color:
            #5d5650;
        }


        .promotion-list li {
          margin-bottom:
            8px;

          font-size:
            clamp(
              13px,
              2.1vw,
              15px
            );

          line-height:
            1.6;
        }


        .promotion-list li:last-child {
          margin-bottom:
            0;
        }


        .caution-box {
          padding:
            17px 18px;

          border-radius:
            14px;

          background:
            #fff5f2;

          border-left:
            4px solid
            #e6654d;

          color:
            #67534d;

          font-size:
            clamp(
              13px,
              2.2vw,
              15px
            );

          line-height:
            1.75;

          word-break:
            keep-all;
        }


        .one-line-tip {
          padding:
            clamp(
              24px,
              4vw,
              31px
            );

          background:
            #332d28;

          text-align:
            center;
        }


        .one-line-tip span {
          display:
            block;

          margin-bottom:
            9px;

          color:
            #f8a16e;

          font-size:
            10px;

          font-weight:
            900;

          letter-spacing:
            1.7px;
        }


        .one-line-tip strong {
          display:
            block;

          color:
            #ffffff;

          font-size:
            clamp(
              16px,
              3vw,
              20px
            );

          line-height:
            1.6;

          font-weight:
            900;

          word-break:
            keep-all;
        }


        .detail-email {
          padding:
            clamp(
              25px,
              4vw,
              33px
            );

          background:
            #f8f5f1;
        }


        .detail-email-head {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            12px;

          margin-bottom:
            18px;
        }


        .detail-email-head > span {
          font-size:
            23px;
        }


        .detail-email-head h3 {
          margin:
            0 0 5px;

          color:
            #332f2b;

          font-size:
            clamp(
              17px,
              3vw,
              20px
            );

          font-weight:
            900;
        }


        .detail-email-head p {
          margin:
            0;

          color:
            #777069;

          font-size:
            13px;

          line-height:
            1.6;
        }


        .detail-email input {
          width:
            100%;

          height:
            56px;

          padding:
            0 16px;

          border:
            1px solid
            #d9d1ca;

          border-radius:
            13px;

          outline:
            none;

          background:
            #ffffff;

          color:
            #222222;

          font-size:
            16px;

          font-weight:
            600;
        }


        .detail-email input:focus {
          border-color:
            #f26a21;

          box-shadow:
            0 0 0 3px
            rgba(
              242,
              106,
              33,
              0.1
            );
        }


        .detail-email button {
          width:
            100%;

          height:
            56px;

          margin-top:
            13px;

          border:
            0;

          border-radius:
            14px;

          background:
            #f26a21;

          color:
            #ffffff;

          font-size:
            16px;

          font-weight:
            900;

          cursor:
            pointer;

          box-shadow:
            0 7px 18px
            rgba(
              242,
              106,
              33,
              0.2
            );
        }


        .detail-email button:disabled {
          background:
            #c9c3bd;

          box-shadow:
            none;

          cursor:
            default;
        }


        .detail-email-error,
        .detail-email-success {
          margin-top:
            11px;

          padding:
            11px 13px;

          border-radius:
            10px;

          font-size:
            13px;

          font-weight:
            700;

          line-height:
            1.5;
        }


        .detail-email-error {
          background:
            #fff0eb;

          color:
            #d4512c;
        }


        .detail-email-success {
          background:
            #eef8ee;

          color:
            #317b3a;
        }


        .email-privacy-note {
          margin:
            11px 0 0;

          color:
            #99918a;

          font-size:
            11px;

          line-height:
            1.55;

          text-align:
            center;

          word-break:
            keep-all;
        }


        @media (
          min-width: 700px
        ) {

          .combo-analysis-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

      `}</style>

    </div>
  );
}


/* =========================================================
   메인
========================================================= */

export default function Home() {

  const detailRef =
    useRef(null);


  const [
    stage,
    setStage,
  ] =
    useState(
      "cover"
    );


  /* =======================================================
     개인정보
  ======================================================= */

  const [
    name,
    setName,
  ] =
    useState("");


  const [
    phone,
    setPhone,
  ] =
    useState("");


  const [
    licenseNumber,
    setLicenseNumber,
  ] =
    useState("");


  const [
    privacyConsent,
    setPrivacyConsent,
  ] =
    useState(false);


  const [
    responseId,
    setResponseId,
  ] =
    useState(null);


  /* =======================================================
     설문
  ======================================================= */

  const [
    currentQuestion,
    setCurrentQuestion,
  ] =
    useState(0);


  const [
    answers,
    setAnswers,
  ] =
    useState({});


  const [
    scores,
    setScores,
  ] =
    useState(
      INITIAL_SCORES
    );


  const [
    selectedType,
    setSelectedType,
  ] =
    useState(null);


  const [
    transitioning,
    setTransitioning,
  ] =
    useState(false);


  const [
    tieTypes,
    setTieTypes,
  ] =
    useState([]);


  /* =======================================================
     결과
  ======================================================= */

  const [
    finalResult,
    setFinalResult,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const [
    saveError,
    setSaveError,
  ] =
    useState("");


  const [
    detailsOpen,
    setDetailsOpen,
  ] =
    useState(false);


  /* =======================================================
     이메일
  ======================================================= */

  const [
    resultEmail,
    setResultEmail,
  ] =
    useState("");


  const [
    emailSending,
    setEmailSending,
  ] =
    useState(false);


  const [
    emailError,
    setEmailError,
  ] =
    useState("");


  const [
    emailSuccess,
    setEmailSuccess,
  ] =
    useState("");


  /* =======================================================
     전화번호
  ======================================================= */

  const handlePhoneChange =
    (event) => {

      let value =
        event.target.value.replace(
          /[^0-9]/g,
          ""
        );


      if (
        value.length >
        11
      ) {
        value =
          value.slice(
            0,
            11
          );
      }


      if (
        value.length <=
        3
      ) {

        setPhone(
          value
        );

        return;
      }


      if (
        value.length <=
        7
      ) {

        setPhone(
          `${value.slice(
            0,
            3
          )}-${value.slice(
            3
          )}`
        );

        return;
      }


      setPhone(
        `${value.slice(
          0,
          3
        )}-${value.slice(
          3,
          7
        )}-${value.slice(
          7
        )}`
      );
    };


  /* =======================================================
     개인정보 저장
  ======================================================= */

  const startSurvey =
    async () => {

      setErrorMessage(
        ""
      );


      if (
        !name.trim()
      ) {

        setErrorMessage(
          "이름을 입력해주세요."
        );

        return;
      }


      if (
        !phone.trim()
      ) {

        setErrorMessage(
          "휴대폰 번호를 입력해주세요."
        );

        return;
      }


      if (
        phone.replace(
          /[^0-9]/g,
          ""
        ).length !==
        11
      ) {

        setErrorMessage(
          "휴대폰 번호를 정확하게 입력해주세요."
        );

        return;
      }


      if (
        !licenseNumber.trim()
      ) {

        setErrorMessage(
          "면허번호를 입력해주세요."
        );

        return;
      }


      if (
        !privacyConsent
      ) {

        setErrorMessage(
          "개인정보 수집 및 이용에 동의해주세요."
        );

        return;
      }


      try {

        setLoading(
          true
        );


        const response =
          await fetch(
            "/api/diagnosis/start",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name,
                  phone,
                  licenseNumber,
                  privacyConsent,
                }),
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
            "정보 저장에 실패했습니다."
          );
        }


        setResponseId(
          result.responseId
        );


        setStage(
          "survey"
        );

      } catch (error) {

        console.error(
          error
        );


        setErrorMessage(
          error.message ||
          "정보 저장 중 오류가 발생했습니다."
        );

      } finally {

        setLoading(
          false
        );
      }
    };


  /* =======================================================
     일반 질문
  ======================================================= */

  const selectAnswer =
    (option) => {

      if (
        transitioning
      ) {
        return;
      }


      const question =
        QUESTIONS[
          currentQuestion
        ];


      const answerKey =
        `q${question.id}`;


      const nextAnswers = {
        ...answers,

        [answerKey]: {

          question:
            question.question,

          context:
            question.context ||
            null,

          answer:
            option.text,

          type:
            option.type,

          typeLabel:
            TYPE_INFO[
              option.type
            ].label,

          score:
            question.weight,
        },
      };


      const nextScores = {
        ...scores,

        [option.type]:
          scores[
            option.type
          ] +
          question.weight,
      };


      setAnswers(
        nextAnswers
      );


      setScores(
        nextScores
      );


      setSelectedType(
        option.type
      );


      setTransitioning(
        true
      );


      setTimeout(
        () => {

          setSelectedType(
            null
          );


          setTransitioning(
            false
          );


          if (
            currentQuestion <
            QUESTIONS.length -
            1
          ) {

            setCurrentQuestion(
              currentQuestion +
              1
            );

            return;
          }


          evaluateMainResult(
            nextAnswers,
            nextScores
          );

        },
        380
      );
    };


  /* =======================================================
     메인성향 판정
  ======================================================= */

  const evaluateMainResult =
    (
      finalAnswers,
      finalScores
    ) => {

      const highest =
        Math.max(
          ...Object.values(
            finalScores
          )
        );


      const highestTypes =
        Object.keys(
          finalScores
        ).filter(
          (type) =>
            finalScores[
              type
            ] ===
            highest
        );


      if (
        highestTypes.length >
        1
      ) {

        setTieTypes(
          highestTypes
        );


        setAnswers(
          finalAnswers
        );


        setScores(
          finalScores
        );


        setStage(
          "tiebreaker"
        );


        return;
      }


      completeDiagnosis(
        highestTypes[0],
        finalAnswers,
        finalScores
      );
    };


  /* =======================================================
     동점 판별
  ======================================================= */

  const selectTiebreaker =
    (type) => {

      if (
        transitioning
      ) {
        return;
      }


      setSelectedType(
        type
      );


      setTransitioning(
        true
      );


      const tieAnswers = {
        ...answers,

        tiebreaker: {

          question:
            "개원 여부를 최종 결정할 때 가장 큰 확신을 주는 것은 무엇인가요?",

          answer:
            TIEBREAKER_OPTIONS[
              type
            ],

          type,

          typeLabel:
            TYPE_INFO[
              type
            ].label,

          score:
            0,
        },
      };


      setTimeout(
        () => {

          setSelectedType(
            null
          );


          setTransitioning(
            false
          );


          completeDiagnosis(
            type,
            tieAnswers,
            scores
          );

        },
        380
      );
    };


  /* =======================================================
     결과 계산 + DB
  ======================================================= */

  const completeDiagnosis =
    async (
      primaryType,
      finalAnswers,
      finalScores
    ) => {

      setStage(
        "analyzing"
      );


      setSaveError(
        ""
      );


      setDetailsOpen(
        false
      );


      const secondaryType =
        selectSecondaryType(
          primaryType,
          finalScores,
          finalAnswers
        );


      const primaryScore =
        finalScores[
          primaryType
        ];


      const secondaryScore =
        finalScores[
          secondaryType
        ];


      const combination =
        getCombinationInfo(
          primaryType,
          secondaryType
        );


      const strength =
        getCombinationStrength(
          primaryScore,
          secondaryScore
        );


      const result = {

        primaryType,

        primaryLabel:
          TYPE_INFO[
            primaryType
          ].label,

        primaryScore,

        secondaryType,

        secondaryLabel:
          TYPE_INFO[
            secondaryType
          ].label,

        secondaryScore,

        combination,

        strength,

        scores:
          finalScores,
      };


      setFinalResult(
        result
      );


      try {

        const [
          response,
        ] =
          await Promise.all([

            fetch(
              "/api/diagnosis/complete",
              {

                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({

                    responseId,

                    answers:
                      finalAnswers,

                    typeScores:
                      finalScores,

                    resultType:
                      result.primaryLabel,

                    resultScore:
                      primaryScore,

                    secondaryType:
                      result.secondaryLabel,

                    secondaryScore,
                  }),
              }
            ),


            new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1400
                )
            ),

          ]);


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "결과 저장에 실패했습니다."
          );
        }

      } catch (error) {

        console.error(
          error
        );


        setSaveError(
          "진단 결과 저장 중 오류가 발생했습니다."
        );


        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              700
            )
        );
      }


      setStage(
        "result"
      );
    };


  /* =======================================================
     상세보기
  ======================================================= */

  const toggleDetails =
    () => {

      if (
        detailsOpen
      ) {

        setDetailsOpen(
          false
        );

        return;
      }


      setDetailsOpen(
        true
      );


      setTimeout(
        () => {

          detailRef.current
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });

        },
        320
      );
    };


  /* =======================================================
     이메일
  ======================================================= */

  const sendResultEmail =
    async () => {

      setEmailError(
        ""
      );


      setEmailSuccess(
        ""
      );


      const email =
        resultEmail
          .trim()
          .toLowerCase();


      if (
        !email
      ) {

        setEmailError(
          "이메일 주소를 입력해주세요."
        );

        return;
      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          email
        )
      ) {

        setEmailError(
          "이메일 주소를 정확하게 입력해주세요."
        );

        return;
      }


      if (
        !responseId
      ) {

        setEmailError(
          "진단 정보가 확인되지 않습니다."
        );

        return;
      }


      try {

        setEmailSending(
          true
        );


        const response =
          await fetch(
            "/api/result/send-email",
            {

              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  responseId,
                  email,
                }),
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
            "이메일 발송에 실패했습니다."
          );
        }


        setEmailSuccess(
          "상세 진단 결과를 이메일로 보내드렸습니다."
        );

      } catch (error) {

        console.error(
          error
        );


        setEmailError(
          error.message ||
          "이메일 발송 중 오류가 발생했습니다."
        );

      } finally {

        setEmailSending(
          false
        );
      }
    };


  /* =======================================================
     다시진단
  ======================================================= */

  const restartDiagnosis =
    () => {

      setStage(
        "cover"
      );


      setName("");
      setPhone("");
      setLicenseNumber("");

      setPrivacyConsent(
        false
      );


      setResponseId(
        null
      );


      setCurrentQuestion(
        0
      );


      setAnswers({});


      setScores({
        ...INITIAL_SCORES,
      });


      setSelectedType(
        null
      );


      setTransitioning(
        false
      );


      setTieTypes([]);


      setFinalResult(
        null
      );


      setErrorMessage("");
      setSaveError("");

      setDetailsOpen(
        false
      );


      setResultEmail("");
      setEmailSending(false);
      setEmailError("");
      setEmailSuccess("");
    };


  const question =
    QUESTIONS[
      currentQuestion
    ];


  const progress =
    (
      (
        currentQuestion +
        1
      ) /
      QUESTIONS.length
    ) *
    100;


  return (

    <main className="app">


      {/* ===================================================
          COVER
      =================================================== */}

      <section
        className={`screen cover-screen ${
          stage !==
          "cover"
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
                setStage(
                  "info"
                )
              }
            >
              진단 시작하기
            </button>

          </div>

        </div>

      </section>


      {/* ===================================================
          개인정보
      =================================================== */}

      <section
        className={`screen info-screen ${
          stage ===
          "info"
            ? "show-screen"
            : ""
        } ${
          stage !==
          "cover" &&
          stage !==
          "info"
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

                value={
                  name
                }

                autoComplete="name"

                onChange={(
                  event
                ) =>
                  setName(
                    event.target
                      .value
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

                value={
                  phone
                }

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

                value={
                  licenseNumber
                }

                onChange={(
                  event
                ) =>
                  setLicenseNumber(
                    event.target
                      .value
                      .replace(
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

                사내 개인정보 처리 기준에
                따라 별도 고지

              </p>


              <p className="privacy-notice">

                개인정보 수집 및 이용에 대한
                동의를 거부할 수 있으며,
                동의하지 않을 경우 진단
                서비스 이용이 제한될 수 있습니다.

              </p>

            </div>


            <label className="consent-row">

              <input
                type="checkbox"

                checked={
                  privacyConsent
                }

                onChange={(
                  event
                ) =>
                  setPrivacyConsent(
                    event.target
                      .checked
                  )
                }
              />


              <span className="custom-check" />


              <span>
                개인정보 수집 및 이용에
                동의합니다.
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

              disabled={
                loading
              }

              onClick={
                startSurvey
              }
            >

              {loading
                ? "정보 저장 중..."
                : "동의하고 진단 시작"}

            </button>

          </div>

        </div>

      </section>


      {/* ===================================================
          12개 질문
      =================================================== */}

      <section
        className={`screen survey-screen ${
          stage ===
          "survey"
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
                currentQuestion +
                1
              ).padStart(
                2,
                "0"
              )}

              {" / "}

              {String(
                QUESTIONS.length
              ).padStart(
                2,
                "0"
              )}

            </span>

          </div>


          <div className="progress">

            <div
              className="progress-bar"

              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>


          <div
            key={
              question.id
            }

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
              ).padStart(
                2,
                "0"
              )}

            </p>


            <h2>
              {question.question}
            </h2>


            {question.context && (

              <div
                style={{
                  marginTop:
                    "-22px",

                  marginBottom:
                    "27px",

                  padding:
                    "15px 16px",

                  borderRadius:
                    "13px",

                  background:
                    "#fff",

                  border:
                    "1px solid #e3dcd5",

                  color:
                    "#746d66",

                  fontSize:
                    "14px",

                  fontWeight:
                    "600",

                  lineHeight:
                    "1.7",

                  wordBreak:
                    "keep-all",
                }}
              >

                {question.context}

              </div>

            )}


            <div className="answers">


              {question.options.map(
                (
                  option,
                  index
                ) => (

                  <button
                    key={
                      `${question.id}-${option.type}`
                    }

                    type="button"

                    disabled={
                      transitioning
                    }

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


      {/* ===================================================
          동점
      =================================================== */}

      <section
        className={`screen survey-screen ${
          stage ===
          "tiebreaker"
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
                width:
                  "100%",
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

              개원 여부를 최종 결정할 때
              가장 큰 확신을 주는 것은
              무엇인가요?

            </h2>


            <p className="tie-description">

              두 가지 이상의 성향 점수가
              비슷하여 마지막 질문을
              드립니다.

            </p>


            <div className="answers">

              {tieTypes.map(
                (
                  type,
                  index
                ) => (

                  <button
                    key={
                      type
                    }

                    type="button"

                    disabled={
                      transitioning
                    }

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


      {/* ===================================================
          분석중
      =================================================== */}

      <section
        className={`screen analyzing-screen ${
          stage ===
          "analyzing"
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


      {/* ===================================================
          결과
      =================================================== */}

      <section
        className={`screen result-screen ${
          stage ===
          "result"
            ? "show-result"
            : ""
        }`}
      >

        {finalResult && (

          <div className="result-container">


            {/* 기본 성향 */}

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
                      finalResult
                        .primaryType
                    ].emoji
                  }

                </span>


                <h1>
                  {
                    finalResult
                      .primaryLabel
                  }
                </h1>

              </div>


              <h2 className="result-title">

                {
                  TYPE_INFO[
                    finalResult
                      .primaryType
                  ].title
                }

              </h2>


              <p className="result-description">

                {
                  TYPE_INFO[
                    finalResult
                      .primaryType
                  ].description
                }

              </p>

            </div>


            {/* 추천 */}

            <div className="result-recommendation">

              <span>
                💡 추천 개원 방향
              </span>


              <p>

                {
                  TYPE_INFO[
                    finalResult
                      .primaryType
                  ].recommendation
                }

              </p>

            </div>


            {/* ============================================
                새로운 복합성향 카드
            ============================================ */}

            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "22px",

                borderRadius:
                  "18px",

                background:
                  "#332d28",

                boxShadow:
                  "0 7px 22px rgba(50, 40, 30, 0.12)",
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 10px",

                  color:
                    "#f8a16e",

                  fontSize:
                    "10px",

                  fontWeight:
                    "900",

                  letterSpacing:
                    "1.7px",
                }}
              >
                YOUR COMBINATION
              </p>


              <div
                style={{
                  marginBottom:
                    "7px",

                  color:
                    "#d9d2cc",

                  fontSize:
                    "13px",

                  fontWeight:
                    "700",
                }}
              >

                {
                  TYPE_INFO[
                    finalResult
                      .primaryType
                  ].emoji
                }

                {" "}

                {
                  finalResult
                    .primaryLabel
                }

                {" × "}

                {
                  TYPE_INFO[
                    finalResult
                      .secondaryType
                  ].emoji
                }

                {" "}

                {
                  finalResult
                    .secondaryLabel
                }

              </div>


              <h2
                style={{
                  margin:
                    "0 0 8px",

                  color:
                    "#ffffff",

                  fontSize:
                    "28px",

                  fontWeight:
                    "900",

                  letterSpacing:
                    "-1px",
                }}
              >

                {
                  finalResult
                    .combination
                    .name
                }

              </h2>


              <div
                style={{
                  display:
                    "inline-block",

                  marginBottom:
                    "13px",

                  padding:
                    "6px 10px",

                  borderRadius:
                    "999px",

                  background:
                    "rgba(242,106,33,0.17)",

                  color:
                    "#f8a16e",

                  fontSize:
                    "11px",

                  fontWeight:
                    "900",
                }}
              >

                {
                  finalResult
                    .strength
                    .label
                }

              </div>


              <p
                style={{
                  margin:
                    "0",

                  color:
                    "#f3efeb",

                  fontSize:
                    "15px",

                  fontWeight:
                    "800",

                  lineHeight:
                    "1.65",

                  wordBreak:
                    "keep-all",
                }}
              >

                “{
                  finalResult
                    .combination
                    .tagline
                }”

              </p>


              <p
                style={{
                  margin:
                    "11px 0 0",

                  color:
                    "#bdb5ae",

                  fontSize:
                    "12px",

                  lineHeight:
                    "1.6",

                  wordBreak:
                    "keep-all",
                }}
              >

                {
                  finalResult
                    .strength
                    .description
                }

              </p>

            </div>


            {/* 점수 */}

            <div className="score-card">

              <h3>
                개원성향 분석
              </h3>


              {Object.entries(
                TYPE_INFO
              ).map(
                ([
                  type,
                  info,
                ]) => {

                  const score =
                    finalResult
                      .scores[
                      type
                    ];


                  const percentage =
                    Math.min(
                      100,

                      Math.round(
                        (
                          score /
                          TOTAL_SCORE
                        ) *
                        100
                      )
                    );


                  return (

                    <div
                      className="score-row"

                      key={
                        type
                      }
                    >

                      <div className="score-label">

                        <span>

                          {
                            info.emoji
                          }

                          {" "}

                          {
                            info.label
                          }

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

              onClick={
                toggleDetails
              }

              style={{
                width:
                  "100%",

                height:
                  "58px",

                marginTop:
                  "24px",

                border:
                  detailsOpen
                    ? "0"
                    : "1.5px solid #f26a21",

                borderRadius:
                  "15px",

                background:
                  detailsOpen
                    ? "#332d28"
                    : "#fff8f3",

                color:
                  detailsOpen
                    ? "#ffffff"
                    : "#f26a21",

                fontSize:
                  "16px",

                fontWeight:
                  "900",

                cursor:
                  "pointer",

                transition:
                  "all 0.3s ease",
              }}
            >

              {detailsOpen
                ? "▲ 상세 분석 접기"
                : "🔍 자세히 보기"}

            </button>


            {/* 상세 애니메이션 */}

            <div
              ref={
                detailRef
              }

              style={{
                maxHeight:
                  detailsOpen
                    ? "15000px"
                    : "0px",

                opacity:
                  detailsOpen
                    ? 1
                    : 0,

                transform:
                  detailsOpen
                    ? "translateY(0)"
                    : "translateY(-14px)",

                marginTop:
                  detailsOpen
                    ? "18px"
                    : "0px",

                overflow:
                  "hidden",

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

                primaryInfo={
                  TYPE_INFO[
                    finalResult
                      .primaryType
                  ]
                }

                secondaryInfo={
                  TYPE_INFO[
                    finalResult
                      .secondaryType
                  ]
                }

                combination={
                  finalResult
                    .combination
                }

                combinationStrength={
                  finalResult
                    .strength
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
