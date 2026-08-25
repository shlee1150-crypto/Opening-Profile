"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  /* =========================
     화면 상태
     cover → info → survey
  ========================= */

  const [stage, setStage] = useState("cover");

  /* =========================
     개인정보
  ========================= */

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] =
    useState("");

  const [privacyConsent, setPrivacyConsent] =
    useState(false);

  /* =========================
     저장 상태
  ========================= */

  const [responseId, setResponseId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================
     휴대폰 번호 자동 하이픈
  ========================= */

  const handlePhoneChange = (event) => {
    let value = event.target.value.replace(
      /[^0-9]/g,
      ""
    );

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    if (value.length < 4) {
      setPhone(value);
      return;
    }

    if (value.length < 8) {
      setPhone(
        `${value.slice(0, 3)}-${value.slice(3)}`
      );

      return;
    }

    setPhone(
      `${value.slice(0, 3)}-${value.slice(
        3,
        7
      )}-${value.slice(7)}`
    );
  };

  /* =========================
     개인정보 저장 후 설문 시작
  ========================= */

  const startSurvey = async () => {
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage(
        "휴대폰 번호를 입력해주세요."
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

      /*
        저장 성공 후
        설문 화면으로 이동
      */

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

  return (
    <main className="app">
      {/* =========================
          표지
      ========================== */}

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
            sizes="(max-width: 600px) 100vw, 520px"
            className="cover-image"
          />

          <div className="start-button-area">
            <button
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

      {/* =========================
          개인정보 입력
      ========================== */}

      <section
        className={`screen info-screen ${
          stage === "info"
            ? "show-screen"
            : ""
        } ${
          stage === "survey"
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
            {/* 이름 */}

            <div className="form-group">
              <label htmlFor="name">
                이름
              </label>

              <input
                id="name"
                type="text"
                placeholder="이름을 입력해주세요"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                autoComplete="name"
              />
            </div>

            {/* 휴대폰 */}

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
                onChange={handlePhoneChange}
                autoComplete="tel"
              />
            </div>

            {/* 면허번호 */}

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

            {/* 개인정보 안내 */}

            <div className="privacy-box">
              <div className="privacy-title">
                개인정보 수집 및 이용 안내
              </div>

              <p>
                <strong>수집 항목</strong>
                <br />
                이름, 휴대폰번호, 면허번호
              </p>

              <p>
                <strong>수집 목적</strong>
                <br />
                개원성향진단 진행 및 결과 관리
              </p>

              <p>
                <strong>보유 및 이용기간</strong>
                <br />
                사내 개인정보 처리 기준에 따라
                별도 고지
              </p>

              <p className="privacy-notice">
                개인정보 수집 및 이용에 대한
                동의를 거부할 수 있으며,
                동의하지 않을 경우 진단 서비스
                이용이 제한될 수 있습니다.
              </p>
            </div>

            {/* 동의 */}

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
                개인정보 수집 및 이용에
                동의합니다.
              </span>
            </label>

            {/* 오류 메시지 */}

            {errorMessage && (
              <div className="form-error">
                {errorMessage}
              </div>
            )}

            {/* 다음 버튼 */}

            <button
              className="info-submit-button"
              onClick={startSurvey}
              disabled={loading}
            >
              {loading
                ? "정보 저장 중..."
                : "동의하고 진단 시작"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          설문
      ========================== */}

      <section
        className={`screen survey-screen ${
          stage === "survey"
            ? "show-screen"
            : ""
        }`}
      >
        <div className="survey-container">
          <div className="survey-header">
            <span>개원성향진단</span>

            <span>01 / 10</span>
          </div>

          <div className="progress">
            <div className="progress-bar" />
          </div>

          <div className="question-area">
            <p className="question-number">
              QUESTION 01
            </p>

            <h2>
              개원을 준비할 때
              <br />
              가장 중요하게 생각하는 것은
              <br />
              무엇인가요?
            </h2>

            <div className="answers">
              <button>
                초기 투자비용
              </button>

              <button>
                병원의 성장 가능성
              </button>

              <button>
                안정적인 운영
              </button>

              <button>
                진료 효율성
              </button>
            </div>

            {/* 개발 확인용
                나중에 삭제 예정 */}

            {responseId && (
              <p className="save-complete">
                정보 저장 완료
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
