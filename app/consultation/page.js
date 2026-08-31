"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./consultation.module.css";


/* =========================================================
   상담 종류

   순서
   1. 입지
   2. 프로세스 상담
   3. 대장비
   4. 소장비 · 기구 · 재료
========================================================= */

const CATEGORY_INFO = {
  location: {
    emoji: "📍",
    title: "입지",
    description:
      "개원 후보지 · 상권 · 입지 검토",
  },

  process: {
    emoji: "📋",
    title: "프로세스 상담",
    description:
      "개원 일정 · 준비과정 · 단계별 개원 프로세스",
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


/* =========================================================
   PAGE
========================================================= */

export default function ConsultationPage() {
  const router =
    useRouter();


  /* =======================================================
     진단 정보
  ======================================================= */

  const [
    responseId,
    setResponseId,
  ] =
    useState(null);


  /* =======================================================
     기존 영업담당자
  ======================================================= */

  const [
    hasSalesManager,
    setHasSalesManager,
  ] =
    useState(false);


  const [
    salesManagerName,
    setSalesManagerName,
  ] =
    useState("");


  /* =======================================================
     화면 상태
  ======================================================= */

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


  /* =======================================================
     SESSION 확인
  ======================================================= */

  useEffect(
    () => {
      try {
        const stored =
          sessionStorage.getItem(
            "openingProfileResultState"
          );


        if (!stored) {
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


        if (
          parsed?.hasSalesManager ===
          true
        ) {
          setHasSalesManager(
            true
          );


          setSalesManagerName(
            parsed.salesManagerName ||
            ""
          );
        } else {
          setHasSalesManager(
            false
          );


          setSalesManagerName(
            ""
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


  /* =======================================================
     상담 저장
  ======================================================= */

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


        let result =
          null;


        try {
          result =
            await response.json();
        } catch {
          result =
            null;
        }


        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
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
          "Consultation submit error:",
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


  /* =======================================================
     STEP 01
     상담 종류 선택
  ======================================================= */

  const chooseCategory =
    async (
      category
    ) => {
      if (
        submitting
      ) {
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


      /* ===================================================
         입지

         담당자 여부와 관계 없이
         선택 즉시 상담 신청 완료
      =================================================== */

      if (
        category ===
        "location"
      ) {
        await submitConsultation({
          category,

          matching:
            null,

          currentManagerName:
            null,
        });


        return;
      }


      /* ===================================================
         프로세스 / 대장비 / 소장비

         기존 영업담당자가 있는 경우
         담당자 매칭 질문 없이 바로 완료
      =================================================== */

      if (
        hasSalesManager
      ) {
        await submitConsultation({
          category,

          matching:
            false,

          currentManagerName:
            null,
        });


        return;
      }


      /* ===================================================
         기존 영업담당자가 없는 경우

         여기서는 저장하지 않고
         아래 STEP 02 표시
      =================================================== */
    };


  /* =======================================================
     STEP 02
     지역 담당자 매칭
  ======================================================= */

  const chooseMatching =
    async (
      value
    ) => {
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
        매칭 필요
        → 선택 즉시 상담 완료
      */

      if (
        value ===
        true
      ) {
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


  /* =======================================================
     매칭 불필요
     담당자 이름 입력 후 신청
  ======================================================= */

  const submitExistingManager =
    async () => {
      const trimmed =
        managerName.trim();


      if (
        trimmed.length <
        2
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


  /* =======================================================
     결과 페이지 복귀
  ======================================================= */

  const returnToResult =
    () => {
      sessionStorage.setItem(
        "openingProfileReturnToResult",
        "1"
      );


      router.push(
        "/"
      );
    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loadingSession
  ) {
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


  /* =======================================================
     진단 정보 없음
  ======================================================= */

  if (
    !responseId
  ) {
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
            진단 결과를
            확인할 수 없습니다.
          </h1>


          <p>
            개원성향진단을 완료한 후
            상담을 신청해주세요.
          </p>


          <button
            type="button"

            onClick={() =>
              router.push(
                "/"
              )
            }
          >
            개원성향진단으로 이동
          </button>

        </div>

      </main>
    );
  }


  /* =======================================================
     상담 완료
  ======================================================= */

  if (
    completed
  ) {
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

            {/* 희망 상담 */}

            <div>

              <span>
                희망 상담
              </span>


              <strong>
                {category?.emoji}{" "}
                {category?.title}
              </strong>

            </div>


            {/* 기존 영업담당자 */}

            {hasSalesManager &&
              salesManagerName && (

              <div>

                <span>
                  오스템 영업담당자
                </span>


                <strong>
                  {salesManagerName}
                </strong>

              </div>

            )}


            {/* 기존 담당자가 없는 경우에만 매칭정보 표시 */}

            {!hasSalesManager &&
              completedData?.category !==
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


            {/* 상담 중 직접 입력한 담당자 */}

            {completedData
              ?.manager_name && (

              <div>

                <span>
                  입력 담당자
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


  /* =======================================================
     지역 담당자 매칭 질문 노출 조건

     영업담당자가 없고,
     입지가 아닌 상담을 선택한 경우
  ======================================================= */

  const shouldShowMatchingStep =
    !hasSalesManager &&
    selectedCategory &&
    selectedCategory !==
      "location";


  /* =======================================================
     상담 신청 화면
  ======================================================= */

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


        {/* =================================================
            HEADER
        ================================================= */}

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


        {/* =================================================
            기존 영업담당자 표시
        ================================================= */}

        {hasSalesManager &&
          salesManagerName && (

          <section
            style={{
              marginBottom:
                "18px",

              padding:
                "20px 23px",

              border:
                "1px solid #f2cfba",

              borderRadius:
                "17px",

              background:
                "#fff8f3",

              boxShadow:
                "0 6px 20px rgba(70,50,35,.04)",
            }}
          >

            <p
              style={{
                margin:
                  "0 0 5px",

                color:
                  "#f26a21",

                fontSize:
                  "9px",

                fontWeight:
                  "900",

                letterSpacing:
                  "1.4px",
              }}
            >
              CURRENT OSSTEM MANAGER
            </p>


            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  "15px",
              }}
            >

              <div>

                <span
                  style={{
                    display:
                      "block",

                    marginBottom:
                      "4px",

                    color:
                      "#817971",

                    fontSize:
                      "12px",

                    fontWeight:
                      "700",
                  }}
                >
                  현재 오스템 영업담당자
                </span>


                <strong
                  style={{
                    color:
                      "#332e29",

                    fontSize:
                      "20px",

                    fontWeight:
                      "900",
                  }}
                >
                  {salesManagerName}
                </strong>

              </div>


              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  width:
                    "46px",

                  height:
                    "46px",

                  borderRadius:
                    "13px",

                  background:
                    "#ffffff",

                  fontSize:
                    "22px",
                }}
              >
                👤
              </div>

            </div>

          </section>

        )}


        {/* =================================================
            STEP 01
        ================================================= */}

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

                  key={
                    key
                  }

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
                    {item.emoji}
                  </span>


                  <div>

                    <strong>
                      {item.title}
                    </strong>


                    <p>
                      {item.description}
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


        {/* =================================================
            STEP 02

            영업담당자 없는 경우에만 노출
        ================================================= */}

        <div
          className={`${styles.reveal} ${
            shouldShowMatchingStep
              ? styles.revealOpen
              : ""
          }`}
        >

          {shouldShowMatchingStep && (

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

                {/* 필요합니다 */}

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


                {/* 필요하지 않습니다 */}

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


              {/* =============================================
                  매칭 불필요
                  담당자 이름 입력
              ============================================= */}

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
                      현재 오스템 담당자 이름
                    </label>


                    <input
                      id="managerName"

                      type="text"

                      autoComplete="off"

                      maxLength={
                        50
                      }

                      placeholder="담당자 이름을 입력해주세요"

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
                          event.target.value
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


        {/* =================================================
            저장 중
        ================================================= */}

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


            상담 신청을 저장하고 있습니다.

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (

          <div
            className={
              styles.errorMessage
            }
          >
            {errorMessage}
          </div>

        )}


        <p
          className={
            styles.privacyNote
          }
        >
          상담 신청 시 진단 과정에서 입력한
          연락처 및 담당자 정보가 상담 진행을 위해
          활용될 수 있습니다.
        </p>

      </div>

    </main>
  );
}
