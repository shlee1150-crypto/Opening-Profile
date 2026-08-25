"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <main className="app">
      {/* =========================
          첫 표지 화면
      ========================== */}
      <section
        className={`screen cover-screen ${
          started ? "hide-screen" : ""
        }`}
      >
        <div className="cover-container">
          {/* 표지 이미지 */}
          <Image
            src="/cover.png"
            alt="오스템임플란트 개원성향진단"
            fill
            priority
            sizes="(max-width: 600px) 100vw, 520px"
            className="cover-image"
          />

          {/* 진단 시작 버튼 */}
          <div className="start-button-area">
            <button
              className="cover-start-button"
              onClick={() => setStarted(true)}
            >
              진단 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          설문 화면
      ========================== */}
      <section
        className={`screen survey-screen ${
          started ? "show-screen" : ""
        }`}
      >
        <div className="survey-container">
          {/* 상단 */}
          <div className="survey-header">
            <span>개원성향진단</span>
            <span>01 / 10</span>
          </div>

          {/* 진행률 */}
          <div className="progress">
            <div className="progress-bar" />
          </div>

          {/* 질문 */}
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

            {/* 선택지 */}
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
          </div>
        </div>
      </section>
    </main>
  );
}
