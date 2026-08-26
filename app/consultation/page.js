"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./consultation.module.css";


const CATEGORY_INFO = {
  location: {
    emoji: "📍",
    title: "입지",
    description:
      "개원 후보지 · 상권 · 입지 검토",
  },

  major_equipment: {
    emoji: "🦷",
    title: "대장비",
    description:
      "체어 · CT · 구강스캐너",
  },

  supplies: {
    emoji: "🧰",
    title:
      "소장비 · 기구 · 재료",
    description:
      "개원에 필요한 소장비와 기구·재료 상담",
  },
};


export default function ConsultationPage() {
  const router =
    useRouter();

  const [
    responseId,
    setResponseId,
  ] =
    useState(null);

  const [
    loadingSession,
    setLoadingSession,
  ] =
    useState(true);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState(null);

  const [
    needsMatching,
    setNeedsMatching,
  ] =
    useState(null);

  const [
    managerName,
    setManagerName,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    completed,
    setCompleted,
  ] =
    useState(false);

  const [
    completedData,
    setCompletedData,
  ] =
    useState(null);


  /* =====================================================
     진단 ID 확인
  ===================================================== */

  useEffect(
    () => {
      try {
        const stored =
          sessionStorage.getItem(
            "openingProfileResultState"
          );

        if (!stored) {
          setLoadingSession(
            false
          );

          return;
        }

        const parsed =
          JSON.parse(
            stored
          );

        if (
          parsed?.responseId
        ) {
          setResponseId(
            parsed.responseId
          );
        }
      } catch (error) {
        console.error(
          "Consultation session error:",
          error
        );
      } finally {
        setLoadingSession(
          false
        );
      }
    },
    []
  );


  /* =====================================================
     상담 저장
  ===================================================== */

  const submitConsultation =
    async ({
      category,
      matching,
      currentManagerName,
    }) => {
      if (
        !responseId ||
        submitting
      ) {
        return;
      }

      try {
        setSubmitting(
          true
        );

        setErrorMessage(
          ""
        );

        const response =
          await fetch(
            "/api/consultation",
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

                  category,

                  needsManagerMatching:
                    matching,

                  managerName:
                    currentManagerName,
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
              "상담 신청에 실패했습니다."
          );
        }

        setCompletedData(
          result.consultation
        );

        setCompleted(
          true
        );

        sessionStorage.setItem(
          "openingProfileConsultationCompleted",
          "1"
        );
      } catch (error) {
        console.error(
          error
        );

        setErrorMessage(
          error.message ||
            "상담 신청 중 오류가 발생했습니다."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };


  /* =====================================================
     1단계 상담 종류
  ===================================================== */

  const chooseCategory =
    async (category) => {
      if (submitting) {
        return;
      }

      setErrorMessage(
        ""
      );

      setSelectedCategory(
        category
      );

      setNeedsMatching(
        null
      );

      setManagerName(
        ""
      );

      /*
        입지는 선택 즉시 완료
      */

      if (
        category ===
        "location"
      ) {
        await submitConsultation({
          category:
            "location",

          matching:
            null,

          currentManagerName:
            null,
        });
      }
    };


  /* =====================================================
     2단계 담당자 매칭
  ===================================================== */

  const chooseMatching =
    async (value) => {
      if (
        !selectedCategory ||
        submitting
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

      setNeedsMatching(
        value
      );

      setManagerName(
        ""
      );

      /*
        필요합니다
        → 선택 즉시 완료
      */

      if (value === true) {
        await submitConsultation({
          category:
            selectedCategory,

          matching:
            true,

          currentManagerName:
            null,
        });
      }
    };


  /* =====================================================
     기존 담당자 이름 입력 후 완료
  ===================================================== */

  const submitExistingManager =
    async () => {
      const trimmed =
        managerName.trim();

      if (
        trimmed.length < 2
      ) {
        setErrorMessage(
          "현재 오스템 담당자 이름을 입력해주세요."
        );

        return;
      }

      await submitConsultation({
        category:
          selectedCategory,

        matching:
          false,

        currentManagerName:
          trimmed,
      });
    };


  /* =====================================================
     결과로 복귀
  ===================================================== */

  const returnToResult =
    () => {
      sessionStorage.setItem(
        "openingProfileReturnToResult",
        "1"
      );

      router.push("/");
    };


  /* =====================================================
     세션 로딩
  ===================================================== */

  if (loadingSession) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loading
          }
        >
          <div
            className={
              styles.spinner
            }
          />

          <p>
            상담 신청 정보를
            준비하고 있습니다.
          </p>
        </div>
      </main>
    );
  }


  /* =====================================================
     진단정보 없음
  ===================================================== */

  if (!responseId) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.errorCard
          }
        >
          <div
            className={
              styles.errorIcon
            }
          >
            🦷
          </div>

          <p
            className={
              styles.brand
            }
          >
            OSSTEM IMPLANT
          </p>

          <h1>
            진단 결과를 확인할 수 없습니다.
          </h1>

          <p>
            개원성향진단을 완료한 후
            상담을 신청해주세요.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
          >
            개원성향진단으로 이동
          </button>
        </div>
      </main>
    );
  }


  /* =====================================================
     완료
  ===================================================== */

  if (completed) {
    const category =
      CATEGORY_INFO[
        completedData?.category ||
        selectedCategory
      ];

    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.completedCard
          }
        >
          <div
            className={
              styles.checkIcon
            }
          >
            ✓
          </div>

          <p
            className={
              styles.brand
            }
          >
            OSSTEM IMPLANT
          </p>

          <h1>
            상담 신청이
            완료되었습니다.
          </h1>

          <p
            className={
              styles.completedDescription
            }
          >
            신청 내용을 확인 후
            상담이 진행될 수 있도록
            안내드리겠습니다.
          </p>

          <div
            className={
              styles.completedSummary
            }
          >
            <div>
              <span>
                희망 상담
              </span>

              <strong>
                {category?.emoji}{" "}
                {category?.title}
              </strong>
            </div>

            {completedData
              ?.category !==
              "location" && (
              <div>
                <span>
                  지역 담당자 매칭
                </span>

                <strong>
                  {completedData
                    ?.needs_manager_matching
                    ? "필요합니다"
                    : "필요하지 않습니다"}
                </strong>
              </div>
            )}

            {completedData
              ?.manager_name && (
              <div>
                <span>
                  현재 오스템 담당자
                </span>

                <strong>
                  {
                    completedData
                      .manager_name
                  }
                </strong>
              </div>
            )}
          </div>

          <button
            type="button"
            className={
              styles.returnButton
            }
            onClick={
              returnToResult
            }
          >
            진단 결과로 돌아가기
          </button>
        </div>
      </main>
    );
  }


  /* =====================================================
     신청 화면
  ===================================================== */

  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.container
        }
      >
        <header
          className={
            styles.header
          }
        >
          <p
            className={
              styles.brand
            }
          >
            OSSTEM IMPLANT
          </p>

          <p
            className={
              styles.kicker
            }
          >
            OPENING CONSULTATION
          </p>

          <h1>
            개원 상담 신청
          </h1>

          <p>
            개원 준비 상황에 맞춰
            필요한 상담을 선택해주세요.
          </p>
        </header>


        {/* ===============================================
            STEP 01
        =============================================== */}

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            <span>
              01
            </span>

            <div>
              <small>
                CONSULTATION
              </small>

              <h2>
                원하는 상담을
                선택해주세요
              </h2>
            </div>
          </div>


          <div
            className={
              styles.categoryList
            }
          >
            {Object.entries(
              CATEGORY_INFO
            ).map(
              ([
                key,
                item,
              ]) => (
                <button
                  type="button"
                  key={key}
                  disabled={
                    submitting
                  }
                  className={`${styles.categoryButton} ${
                    selectedCategory ===
                    key
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() =>
                    chooseCategory(
                      key
                    )
                  }
                >
                  <span
                    className={
                      styles.categoryEmoji
                    }
                  >
                    {
                      item.emoji
                    }
                  </span>

                  <div>
                    <strong>
                      {
                        item.title
                      }
                    </strong>

                    <p>
                      {
                        item.description
                      }
                    </p>
                  </div>

                  <span
                    className={
                      styles.radio
                    }
                  />
                </button>
              )
            )}
          </div>
        </section>


        {/* ===============================================
            STEP 02
        =============================================== */}

        <div
          className={`${styles.reveal} ${
            selectedCategory &&
            selectedCategory !==
              "location"
              ? styles.revealOpen
              : ""
          }`}
        >
          {selectedCategory &&
            selectedCategory !==
              "location" && (
            <section
              className={
                styles.section
              }
            >
              <div
                className={
                  styles.sectionTitle
                }
              >
                <span>
                  02
                </span>

                <div>
                  <small>
                    MANAGER MATCHING
                  </small>

                  <h2>
                    지역 담당자 매칭이
                    필요하신가요?
                  </h2>
                </div>
              </div>


              <div
                className={
                  styles.matchingList
                }
              >
                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  className={`${styles.matchButton} ${
                    needsMatching ===
                    true
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() =>
                    chooseMatching(
                      true
                    )
                  }
                >
                  <span
                    className={
                      styles.radio
                    }
                  />

                  <div>
                    <strong>
                      필요합니다
                    </strong>

                    <p>
                      지역 담당자 매칭을
                      요청합니다.
                    </p>
                  </div>
                </button>


                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  className={`${styles.matchButton} ${
                    needsMatching ===
                    false
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() =>
                    chooseMatching(
                      false
                    )
                  }
                >
                  <span
                    className={
                      styles.radio
                    }
                  />

                  <div>
                    <strong>
                      필요하지 않습니다
                    </strong>

                    <p>
                      현재 상담 중인
                      오스템 담당자가 있습니다.
                    </p>
                  </div>
                </button>
              </div>


              {/* ===========================================
                  담당자 이름
              =========================================== */}

              <div
                className={`${styles.managerReveal} ${
                  needsMatching ===
                  false
                    ? styles.managerRevealOpen
                    : ""
                }`}
              >
                {needsMatching ===
                  false && (
                  <div
                    className={
                      styles.managerBox
                    }
                  >
                    <label
                      htmlFor="managerName"
                    >
                      현재 오스템 담당자
                      이름
                    </label>

                    <input
                      id="managerName"
                      type="text"
                      autoComplete="off"
                      placeholder="담당자 이름을 입력해주세요"
                      maxLength={
                        50
                      }
                      value={
                        managerName
                      }
                      disabled={
                        submitting
                      }
                      onChange={(
                        event
                      ) => {
                        setManagerName(
                          event.target
                            .value
                        );

                        setErrorMessage(
                          ""
                        );
                      }}
                    />

                    <button
                      type="button"
                      className={
                        styles.submitButton
                      }
                      disabled={
                        submitting
                      }
                      onClick={
                        submitExistingManager
                      }
                    >
                      {submitting
                        ? "상담 신청 중..."
                        : "상담 신청하기"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>


        {submitting && (
          <div
            className={
              styles.submittingBox
            }
          >
            <div
              className={
                styles.smallSpinner
              }
            />

            상담 신청을
            저장하고 있습니다.
          </div>
        )}


        {errorMessage && (
          <div
            className={
              styles.errorMessage
            }
          >
            {
              errorMessage
            }
          </div>
        )}


        <p
          className={
            styles.privacyNote
          }
        >
          상담 신청 시 진단 과정에서 입력한
          연락처 정보가 상담 진행을 위해
          활용될 수 있습니다.
        </p>
      </div>
    </main>
  );
}
