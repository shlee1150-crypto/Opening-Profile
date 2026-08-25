"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <main className="app">
      {/* 표지 화면 */}
      <section
        className={`screen cover-screen ${started ? "hide-screen" : ""}`}
      >
        <div className="cover-image-wrap">
          <Image
            src="/cover.png"
            alt="오스템임플란트 개원성향진단 표지"
            fill
            priority
            className="cover-image"
          />

          <div className="cover-overlay">
            <button
              className="cover-start-button"
              onClick={() => setStarted(true)}
            >
              진단 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* 설문 화면 */}
      <section
        className={`screen survey-screen ${started ? "show-screen" : ""}`}
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
            <p className="question-number">QUESTION 01</p>

            <h2>
              개원을 준비할 때
              <br />
              가장 중요하게 생각하는 것은
              <br />
              무엇인가요?
            </h2>

            <div className="answers">
              <button>초기 투자비용</button>
              <button>병원의 성장 가능성</button>
              <button>안정적인 운영</button>
              <button>진료 효율성</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
