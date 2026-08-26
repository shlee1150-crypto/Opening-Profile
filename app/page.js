"use client";

import { useState } from "react";
import Image from "next/image";
import Script from "next/script";

const TYPE_INFO = {
  stable: {
    label: "안정정착형",
    emoji: "🏠",
    title: "오래 갈수록 강한 병원을 만드는 원장님",
    description:
      "단기적인 성과보다 안정적인 운영과 꾸준한 환자 확보를 중요하게 생각하는 성향입니다.",
    recommendation:
      "화려한 메인상권보다 꾸준한 환자가 쌓이는 주거상권이 잘 맞습니다.",
  },

  aggressive: {
    label: "집중공격형",
    emoji: "🚀",
    title: "할 거라면 제대로, 빠르게 성장하는 원장님",
    description:
      "좋은 기회가 보이면 적극적으로 투자하고 빠른 성장과 높은 성과를 추구하는 성향입니다.",
    recommendation:
      "좋은 입지를 잡고 적극적으로 투자해 빠르게 성장하는 전략이 잘 맞습니다.",
  },

  analytical: {
    label: "데이터분석형",
    emoji: "📊",
    title: "감보다 숫자가 먼저인 전략가 원장님",
    description:
      "직감보다 객관적인 데이터와 투자 대비 효율을 확인한 뒤 의사결정하는 성향입니다.",
    recommendation:
      "좋은 자리보다 데이터를 통해 원장님에게 가장 유리한 자리를 찾는 것이 좋습니다.",
  },

  pioneer: {
    label: "선점개척형",
    emoji: "🌱",
    title: "남들이 들어가기 전에 먼저 기회를 잡는 원장님",
    description:
      "현재의 완성도보다 미래 성장 가능성을 중요하게 보고 새로운 기회를 선점하려는 성향입니다.",
    recommendation:
      "이미 완성된 상권보다 앞으로 커질 지역을 한발 먼저 선점하는 전략이 잘 맞습니다.",
  },
};

const QUESTIONS = [
  {
    id: 1,
    weight: 2,
    question:
      "개원할 때 가장 중요하게 생각하는 것은?",
    options: [
      {
        type: "analytical",
        text:
          "인구·경쟁·매출 등 객관적인 데이터",
      },
      {
        type: "stable",
        text:
          "꾸준히 환자가 찾아오는 안정적인 상권",
      },
      {
        type: "pioneer",
        text:
          "앞으로 크게 성장할 가능성이 있는 지역",
      },
      {
        type: "aggressive",
        text:
          "높은 매출을 기대할 수 있는 좋은 상권",
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
        text:
          "직원과 환자가 편안하게 오래 함께하는 병원",
      },
      {
        type: "analytical",
        text:
          "시스템이 잘 갖춰져 효율적으로 운영되는 병원",
      },
      {
        type: "aggressive",
        text:
          "목표를 세우고 빠르게 성과를 만들어 가는 병원",
      },
      {
        type: "pioneer",
        text:
          "변화하는 환경에 맞춰 계속 발전하는 병원",
      },
    ],
  },

  {
    id: 3,
    weight: 2,
    question:
      "경쟁 치과가 이미 많은 지역이라면?",
    options: [
      {
        type: "pioneer",
        text:
          "경쟁이 더 생기기 전에 새로운 지역을 선점한다",
      },
      {
        type: "aggressive",
        text:
          "수요가 많다는 뜻이니 도전한다",
      },
      {
        type: "stable",
        text:
          "경쟁이 적은 다른 지역을 찾아본다",
      },
      {
        type: "analytical",
        text:
          "경쟁 치과의 규모와 환자 수 등을 분석해본다",
      },
    ],
  },

  {
    id: 4,
    weight: 2,
    question:
      "개원 비용이 예상보다 5천만 원 늘어난다면?",
    options: [
      {
        type: "analytical",
        text:
          "추가 투자 대비 예상 수익을 계산해본다",
      },
      {
        type: "pioneer",
        text:
          "미래 성장 가능성이 높다면 투자한다",
      },
      {
        type: "stable",
        text:
          "꼭 필요한 부분만 남기고 비용을 줄인다",
      },
      {
        type: "aggressive",
        text:
          "좋은 입지를 위해서라면 추가 투자한다",
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
        text:
          "이 기세를 놓치지 않고 더 적극적으로 확장해본다.",
      },
      {
        type: "stable",
        text:
          "지금의 좋은 흐름을 꾸준히 유지하는 데 집중한다.",
      },
      {
        type: "pioneer",
        text:
          "앞으로 더 커질 가능성을 생각하며 다음 기회를 준비한다.",
      },
      {
        type: "analytical",
        text:
          "어떤 요인이 좋은 결과를 만들었는지 먼저 살펴본다.",
      },
    ],
  },

  {
    id: 6,
    weight: 2,
    question:
      "개원 전 상권분석 자료를 받았다면?",
    options: [
      {
        type: "pioneer",
        text:
          "현재보다 향후 3~5년의 지역 변화를 본다",
      },
      {
        type: "analytical",
        text:
          "인구·연령·소득·경쟁·유동인구를 꼼꼼히 분석한다",
      },
      {
        type: "stable",
        text:
          "주변에 실제 환자가 얼마나 있는지 먼저 본다",
      },
      {
        type: "aggressive",
        text:
          "예상 매출과 상권 규모를 먼저 본다",
      },
    ],
  },

  {
    id: 7,
    weight: 2,
    question:
      "다음 중 더 끌리는 개원 방식은?",
    options: [
      {
        type: "stable",
        text:
          "작지만 안정적인 규모로 시작한다.",
      },
      {
        type: "pioneer",
        text:
          "성장 가능성이 큰 지역에서 먼저 시작한다.",
      },
      {
        type: "aggressive",
        text:
          "처음부터 규모 있게 시작해 빠르게 성장한다.",
      },
      {
        type: "analytical",
        text:
          "데이터를 바탕으로 적정 규모를 결정한다.",
      },
    ],
  },

  {
    id: 8,
    weight: 2,
    question:
      "원장님이 가장 중요하게 생각하는 개원의 모습은?",
    options: [
      {
        type: "analytical",
        text:
          "투자 대비 효율적인 수익을 내는 치과",
      },
      {
        type: "aggressive",
        text:
          "높은 매출과 빠른 성장을 이루는 치과",
      },
      {
        type: "pioneer",
        text:
          "지역의 성장과 함께 커지는 치과",
      },
      {
        type: "stable",
        text:
          "한 지역에서 오래 사랑받는 치과",
      },
    ],
  },
];

const TIEBREAKER_OPTIONS = {
  stable:
    "안정적인 배후수요와 낮은 운영 부담",

  aggressive:
    "높은 예상매출과 빠른 성장 가능성",

  analytical:
    "수치로 검증된 투자 대비 수익성",

  pioneer:
    "향후 개발계획과 선점 가능성",
};

const INITIAL_SCORES = {
  stable: 0,
  aggressive: 0,
  analytical: 0,
  pioneer: 0,
};

export default function Home() {
  const [stage, setStage] =
    useState("cover");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    licenseNumber,
    setLicenseNumber,
  ] = useState("");

  const [
    privacyConsent,
    setPrivacyConsent,
  ] = useState(false);

  const [
    responseId,
    setResponseId,
  ] = useState(null);

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    scores,
    setScores,
  ] = useState(
    INITIAL_SCORES
  );

  const [
    selectedType,
    setSelectedType,
  ] = useState(null);

  const [
    transitioning,
    setTransitioning,
  ] = useState(false);

  const [
    tieTypes,
    setTieTypes,
  ] = useState([]);

  const [
    finalResult,
    setFinalResult,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

  const [
    resultToken,
    setResultToken,
  ] = useState(null);

  /* =========================================
     전화번호 자동 하이픈
  ========================================= */

  const handlePhoneChange = (
    event
  ) => {
    let value =
      event.target.value.replace(
        /[^0-9]/g,
        ""
      );

    if (value.length > 11) {
      value =
        value.slice(
          0,
          11
        );
    }

    if (value.length <= 3) {
      setPhone(value);

      return;
    }

    if (value.length <= 7) {
      setPhone(
        `${value.slice(
          0,
          3
        )}-${value.slice(3)}`
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
      )}-${value.slice(7)}`
    );
  };

  /* =========================================
     개인정보 저장
  ========================================= */

  const startSurvey =
    async () => {
      setErrorMessage("");

      if (!name.trim()) {
        setErrorMessage(
          "이름을 입력해주세요."
        );

        return;
      }

      if (!phone.trim()) {
        setErrorMessage(
          "휴대폰 번호를 입력해주세요."
        );

        return;
      }

      if (
        phone.replace(
          /[^0-9]/g,
          ""
        ).length !== 11
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

      if (!privacyConsent) {
        setErrorMessage(
          "개인정보 수집 및 이용에 동의해주세요."
        );

        return;
      }

      try {
        setLoading(true);

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

  /* =========================================
     일반 질문 선택
  ========================================= */

  const selectAnswer = (
    option
  ) => {
    if (transitioning) {
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

  /* =========================================
     8문항 완료 후 결과 확인
  ========================================= */

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

  /* =========================================
     동점 판별 질문
  ========================================= */

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

          score: 0,
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

  /* =========================================
     결과 계산 + Supabase 저장
  ========================================= */

  const completeDiagnosis =
    async (
      primaryType,
      finalAnswers,
      finalScores
    ) => {
      setStage(
        "analyzing"
      );

      setSaveError("");

      const sorted =
        Object.entries(
          finalScores
        ).sort(
          (a, b) =>
            b[1] -
            a[1]
        );

      const secondaryEntry =
        sorted.find(
          ([type]) =>
            type !==
            primaryType
        );

      const result = {
        primaryType,

        primaryLabel:
          TYPE_INFO[
            primaryType
          ].label,

        primaryScore:
          finalScores[
            primaryType
          ],

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
                      result.primaryScore,

                    secondaryType:
                      result.secondaryLabel,

                    secondaryScore:
                      result.secondaryScore,
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

        setResultToken(
          data.resultToken ||
            null
        );
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

  /* =========================================
     처음부터 다시
  ========================================= */

  const restartDiagnosis =
    () => {
      setStage(
        "cover"
      );

      setName("");

      setPhone("");

      setLicenseNumber(
        ""
      );

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

      setErrorMessage(
        ""
      );

      setSaveError("");

      setResultToken(
        null
      );
    };

  /* =========================================
     카카오 SDK 초기화
  ========================================= */

  const initializeKakao =
    () => {
      if (
        typeof window ===
          "undefined" ||
        !window.Kakao
      ) {
        return false;
      }

      const kakaoJavaScriptKey =
        process.env
          .NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

      if (
        !kakaoJavaScriptKey
      ) {
        console.error(
          "NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 설정되어 있지 않습니다."
        );

        return false;
      }

      if (
        !window.Kakao
          .isInitialized()
      ) {
        window.Kakao.init(
          kakaoJavaScriptKey
        );
      }

      return window.Kakao
        .isInitialized();
    };

  /* =========================================
     카카오톡으로 결과 보내기
  ========================================= */

  const sendResultByKakao =
    () => {
      setSaveError("");

      if (
        !finalResult ||
        !resultToken
      ) {
        setSaveError(
          "결과 링크가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요."
        );

        return;
      }

      if (
        !initializeKakao()
      ) {
        setSaveError(
          "카카오톡 공유 기능을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요."
        );

        return;
      }

      const resultUrl =
        `${window.location.origin}/r/${resultToken}`;

      try {
        window.Kakao.Share.sendDefault(
          {
            objectType:
              "text",

            text:
              `오스템임플란트 개원성향진단\n\n` +
              `${
                TYPE_INFO[
                  finalResult
                    .primaryType
                ].emoji
              } 원장님의 개원성향은 ${
                finalResult
                  .primaryLabel
              }입니다.\n\n` +
              `아래 버튼을 눌러 상세 결과를 확인해주세요.`,

            link: {
              mobileWebUrl:
                resultUrl,

              webUrl:
                resultUrl,
            },

            buttonTitle:
              "개원성향 결과 보기",
          }
        );
      } catch (error) {
        console.error(
          "Kakao share error:",
          error
        );

        setSaveError(
          "카카오톡 공유창을 열지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    };

  const question =
    QUESTIONS[
      currentQuestion
    ];

  const progress =
    ((currentQuestion +
      1) /
      QUESTIONS.length) *
    100;

  return (
    <main className="app">

      {/* 카카오 JavaScript SDK */}

      <Script
        id="kakao-javascript-sdk"
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js"
        integrity="sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={
          initializeKakao
        }
        onError={() => {
          console.error(
            "Kakao JavaScript SDK load error"
          );
        }}
      />

      {/* =================================
          표지
      ================================= */}

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

      {/* =================================
          개인정보
      ================================= */}

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

                이름,
                휴대폰번호,
                면허번호
              </p>

              <p>
                <strong>
                  수집 목적
                </strong>

                <br />

                개원성향진단 진행,
                결과 관리 및 요청 시
                결과 제공
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
                개인정보 수집 및
                이용에 대한 동의를
                거부할 수 있으며,
                동의하지 않을 경우
                진단 서비스 이용이
                제한될 수 있습니다.
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
                {
                  errorMessage
                }
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

              {
                loading
                  ? "정보 저장 중..."
                  : "동의하고 진단 시작"
              }

            </button>

          </div>

        </div>

      </section>

      {/* =================================
          Q1 ~ Q8
      ================================= */}

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
              {
                String(
                  currentQuestion +
                    1
                ).padStart(
                  2,
                  "0"
                )
              }

              {" / "}

              {
                String(
                  QUESTIONS.length
                ).padStart(
                  2,
                  "0"
                )
              }
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

              {
                String(
                  question.id
                ).padStart(
                  2,
                  "0"
                )
              }

            </p>

            <h2>
              {
                question.question
              }
            </h2>

            <div className="answers">

              {
                question.options.map(
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
                        {
                          index +
                          1
                        }
                      </span>

                      <span className="option-text">
                        {
                          option.text
                        }
                      </span>

                    </button>

                  )
                )
              }

            </div>

          </div>

        </div>

      </section>

      {/* =================================
          동점 판별 질문
      ================================= */}

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

              {
                tieTypes.map(
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
                        {
                          index +
                          1
                        }
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
                )
              }

            </div>

          </div>

        </div>

      </section>

      {/* =================================
          분석중
      ================================= */}

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

      {/* =================================
          결과
      ================================= */}

      <section
        className={`screen result-screen ${
          stage ===
          "result"
            ? "show-result"
            : ""
        }`}
      >

        {
          finalResult &&
          (

            <div className="result-container">

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

              {
                finalResult
                  .secondaryType &&
                (

                  <div className="secondary-result">

                    <span>
                      함께 나타난 보조 성향
                    </span>

                    <strong>

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

                    </strong>

                    <p>
                      주 성향과 함께{" "}
                      {
                        finalResult
                          .secondaryLabel
                      }{" "}
                      성향도 나타났습니다.
                    </p>

                  </div>

                )
              }

              <div className="score-card">

                <h3>
                  개원성향 분석
                </h3>

                {
                  Object.entries(
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
                              14
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
                              }{" "}
                              {
                                info.label
                              }
                            </span>

                            <strong>
                              {
                                score
                              }
                              점
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
                  )
                }

              </div>

              {
                saveError &&
                (

                  <div className="result-save-error">
                    {
                      saveError
                    }
                  </div>

                )
              }

              {/* ==============================
                  카카오톡 공유 버튼
              ============================== */}

              {
                resultToken &&
                (
                  <>

                    <button
                      type="button"
                      className="restart-button"
                      onClick={
                        sendResultByKakao
                      }
                      style={{
                        marginTop:
                          "24px",

                        background:
                          "#FEE500",

                        color:
                          "#191919",

                        border:
                          "0",

                        boxShadow:
                          "0 7px 18px rgba(0, 0, 0, 0.10)",
                      }}
                    >
                      💬 카카오톡으로 결과 보내기
                    </button>

                    <p
                      style={{
                        marginTop:
                          "10px",

                        color:
                          "#817a73",

                        fontSize:
                          "12px",

                        lineHeight:
                          1.6,

                        textAlign:
                          "center",

                        wordBreak:
                          "keep-all",
                      }}
                    >
                      카카오톡에서 받을
                      친구 또는 채팅방을
                      선택해주세요.
                      <br />
                      결과 링크가 포함된
                      메시지가 준비됩니다.
                    </p>

                  </>
                )
              }

              <button
                type="button"
                className="restart-button"
                onClick={
                  restartDiagnosis
                }
                style={{
                  marginTop:
                    resultToken
                      ? "14px"
                      : "24px",
                }}
              >
                다시 진단하기
              </button>

            </div>

          )
        }

      </section>

    </main>
  );
}
