"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./consultation.module.css";


/* =========================================================
   상담 항목
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
    title: "소장비 · 기구 · 재료",
    description:
      "개원에 필요한 소장비와 기구·재료 상담",
  },
};


const CATEGORY_ORDER = [
  "location",
  "process",
  "major_equipment",
  "supplies",
];


/* =========================================================
   MAIN
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
  ] = useState(null);


  /* =======================================================
     영업담당자
  ======================================================= */

  const [
    hasSalesManager,
    setHasSalesManager,
  ] = useState(false);


  const [
    salesManagerName,
    setSalesManagerName,
  ] = useState("");


  /* =======================================================
     ★ 복수 상담 선택
  ======================================================= */

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState([]);


  /* =======================================================
     담당자 매칭
  ======================================================= */

  const [
    needsMatching,
    setNeedsMatching,
  ] = useState(null);


  const [
    managerName,
    setManagerName,
  ] = useState("");


  /* =======================================================
     화면 상태
  ======================================================= */

  const [
    loadingSession,
    setLoadingSession,
  ] = useState(true);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [
    completed,
    setCompleted,
  ] = useState(false);


  const [
    completedData,
    setCompletedData,
  ] = useState(null);


  /* =======================================================
     SESSION
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem(
          "openingProfileResultState"
        );


      if (!stored) {
        return;
      }


      const parsed =
        JSON.parse(stored);


      if (parsed?.responseId) {
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
  }, []);


  /* =======================================================
     입지 외 상담 포함 여부

     process
     major_equipment
     supplies
  ======================================================= */

  const hasNonLocationCategory =
    useMemo(() => {
      return selectedCategories.some(
        (category) =>
          category !== "location"
      );
    }, [
      selectedCategories,
    ]);


  /* =======================================================
     매칭 질문 표시 조건

     기존 영업담당자가 없으며
     입지 이외 상담이 하나라도 있을 때
  ======================================================= */

  const shouldShowMatchingStep =
    !hasSalesManager &&
    hasNonLocationCategory;


  /* =======================================================
     ★ 상담 선택 / 선택 해제
  ======================================================= */

  const toggleCategory =
    (category) => {
      if (submitting) {
        return;
      }


      setErrorMessage(
        ""
      );


      setSelectedCategories(
        (previous) => {
          const exists =
            previous.includes(
              category
            );


          let next;


          if (exists) {
            /*
              이미 선택 → 선택 해제
            */

            next =
              previous.filter(
                (item) =>
                  item !== category
              );
          } else {
            /*
              새 선택 → 기존 선택 유지하면서 추가
            */

            next = [
              ...previous,
              category,
            ];
          }


          /*
            항상 정해진 순서로 정렬
          */

          return CATEGORY_ORDER.filter(
            (item) =>
              next.includes(item)
          );
        }
      );
    };


  /* =======================================================
     입지 외 상담이 모두 해제되면
     담당자 매칭값도 자동 초기화
  ======================================================= */

  useEffect(() => {
    if (
      shouldShowMatchingStep
    ) {
      return;
    }


    setNeedsMatching(
      null
    );

    setManagerName(
      ""
    );
  }, [
    shouldShowMatchingStep,
  ]);


  /* =======================================================
     담당자 매칭 선택
  ======================================================= */

  const chooseMatching =
    (value) => {
      if (submitting) {
        return;
      }


      setErrorMessage(
        ""
      );


      setNeedsMatching(
        value
      );


      if (value === true) {
        setManagerName(
          ""
        );
      }
    };


  /* =======================================================
     ★ 최종 상담 신청

     여기서만 DB 저장
  ======================================================= */

  const submitConsultation =
    async () => {
      if (submitting) {
        return;
      }


      setErrorMessage(
        ""
      );


      /* ===============================================
         1개 이상 선택 필수
      =============================================== */

      if (
        selectedCategories.length ===
        0
      ) {
        setErrorMessage(
          "원하는 상담을 하나 이상 선택해주세요."
        );

        return;
      }


      /* ===============================================
         담당자가 없고
         입지 외 상담이 있으면
         매칭 여부 선택 필수
      =============================================== */

      if (
        shouldShowMatchingStep &&
        typeof needsMatching !==
          "boolean"
      ) {
        setErrorMessage(
          "지역 담당자 매칭 여부를 선택해주세요."
        );

        return;
      }


      /* ===============================================
         매칭 필요하지 않음 선택
         → 담당자 이름 필수
      =============================================== */

      if (
        shouldShowMatchingStep &&
        needsMatching === false &&
        managerName.trim().length <
          2
      ) {
        setErrorMessage(
          "현재 오스템 담당자 이름을 입력해주세요."
        );

        return;
      }


      if (!responseId) {
        setErrorMessage(
          "완료된 진단 정보를 확인할 수 없습니다."
        );

        return;
      }


      try {
        setSubmitting(
          true
        );


        const response =
          await fetch(
            "/api/consultation",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  responseId,

                  /*
                    ★ 배열 그대로 전송
                  */

                  categories:
                    selectedCategories,

                  needsManagerMatching:
                    shouldShowMatchingStep
                      ? needsMatching
                      : null,

                  managerName:
                    shouldShowMatchingStep &&
                    needsMatching === false
                      ? managerName.trim()
                      : null,
                }),
            }
          );


        let result = null;


        try {
          result =
            await response.json();
        } catch {
          result = null;
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
     진단 결과로
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

  if (loadingSession) {
    return (
      <main className={styles.page}>

        <div className={styles.loading}>

          <div className={styles.spinner} />

          <p>
            상담 신청 정보를 준비하고 있습니다.
          </p>

        </div>

      </main>
    );
  }


  /* =======================================================
     진단 정보 없음
  ======================================================= */

  if (!responseId) {
    return (
      <main className={styles.page}>

        <div className={styles.errorCard}>

          <div className={styles.errorIcon}>
            🦷
          </div>


          <p className={styles.brand}>
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
              router.push("/")
            }
          >
            개원성향진단으로 이동
          </button>

        </div>

      </main>
    );
  }


  /* =======================================================
     완료
  ======================================================= */

  if (completed) {
    const savedCategories =
      Array.isArray(
        completedData?.categories
      ) &&
      completedData.categories.length >
        0
        ? completedData.categories
        : selectedCategories;


    const completedHasNonLocation =
      savedCategories.some(
        (category) =>
          category !==
          "location"
      );


    return (
      <main className={styles.page}>

        <div className={styles.completedCard}>

          <div className={styles.checkIcon}>
            ✓
          </div>


          <p className={styles.brand}>
            OSSTEM IMPLANT
          </p>


          <h1>
            상담 신청이
            완료되었습니다.
          </h1>


          <p className={styles.completedDescription}>
            신청 내용을 확인 후
            상담이 진행될 수 있도록
            안내드리겠습니다.
          </p>


          <div className={styles.completedSummary}>


            {/* 선택 상담 */}

            <div className={styles.completedCategoriesRow}>

              <span>
                희망 상담
              </span>


              <div className={styles.completedCategoryList}>

                {savedCategories.map(
                  (category) => {
                    const info =
                      CATEGORY_INFO[
                        category
                      ];


                    if (!info) {
                      return null;
                    }


                    return (
                      <strong
                        key={category}
                      >
                        {info.emoji}{" "}
                        {info.title}
                      </strong>
                    );
                  }
                )}

              </div>

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


            {/* 담당자 없는 경우 */}

            {!hasSalesManager &&
              completedHasNonLocation && (

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


            {/* 직접 입력한 담당자 */}

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
            className={styles.returnButton}
            onClick={returnToResult}
          >
            진단 결과로 돌아가기
          </button>

        </div>

      </main>
    );
  }


  /* =======================================================
     신청 화면
  ======================================================= */

  return (
    <main className={styles.page}>

      <div className={styles.container}>


        {/* =================================================
            HEADER
        ================================================= */}

        <header className={styles.header}>

          <p className={styles.brand}>
            OSSTEM IMPLANT
          </p>


          <p className={styles.kicker}>
            OPENING CONSULTATION
          </p>


          <h1>
            개원 상담 신청
          </h1>


          <p>
            필요한 상담을 선택해주세요.
            여러 항목을 동시에 선택할 수 있습니다.
          </p>

        </header>


        {/* =================================================
            기존 영업담당자
        ================================================= */}

        {hasSalesManager &&
          salesManagerName && (

          <section className={styles.salesManagerCard}>

            <div>

              <p>
                CURRENT OSSTEM MANAGER
              </p>


              <span>
                현재 오스템 영업담당자
              </span>


              <strong>
                {salesManagerName}
              </strong>

            </div>


            <div className={styles.salesManagerIcon}>
              👤
            </div>

          </section>

        )}


        {/* =================================================
            STEP 01
        ================================================= */}

        <section className={styles.section}>

          <div className={styles.sectionTitle}>

            <span>
              01
            </span>


            <div>

              <small>
                CONSULTATION
              </small>


              <h2>
                원하는 상담을 선택해주세요
              </h2>


              <p className={styles.multiSelectNotice}>
                복수 선택 가능합니다.
              </p>

            </div>

          </div>


          <div className={styles.categoryList}>

            {CATEGORY_ORDER.map(
              (key) => {
                const item =
                  CATEGORY_INFO[key];


                const selected =
                  selectedCategories.includes(
                    key
                  );


                return (
                  <button
                    key={key}

                    type="button"

                    disabled={
                      submitting
                    }

                    className={`${styles.categoryButton} ${
                      selected
                        ? styles.selected
                        : ""
                    }`}

                    onClick={() =>
                      toggleCategory(
                        key
                      )
                    }
                  >

                    <span className={styles.categoryEmoji}>
                      {item.emoji}
                    </span>


                    <div className={styles.categoryText}>

                      <strong>
                        {item.title}
                      </strong>


                      <p>
                        {item.description}
                      </p>

                    </div>


                    {/* =====================================
                        ★ 라디오가 아니라 체크박스
                    ===================================== */}

                    <span
                      className={`${styles.checkBox} ${
                        selected
                          ? styles.checkBoxSelected
                          : ""
                      }`}
                    >
                      {selected
                        ? "✓"
                        : ""}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </section>


        {/* =================================================
            STEP 02

            담당자 없는 경우에만
        ================================================= */}

        <div
          className={`${styles.reveal} ${
            shouldShowMatchingStep
              ? styles.revealOpen
              : ""
          }`}
        >

          {shouldShowMatchingStep && (

            <section className={styles.section}>

              <div className={styles.sectionTitle}>

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


              <div className={styles.matchingList}>


                {/* 필요 */}

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

                  <span className={styles.radio} />


                  <div>

                    <strong>
                      필요합니다
                    </strong>


                    <p>
                      지역 담당자 매칭을 요청합니다.
                    </p>

                  </div>

                </button>


                {/* 불필요 */}

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

                  <span className={styles.radio} />


                  <div>

                    <strong>
                      필요하지 않습니다
                    </strong>


                    <p>
                      현재 상담 중인 오스템 담당자가 있습니다.
                    </p>

                  </div>

                </button>

              </div>


              {/* 담당자 이름 */}

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

                  <div className={styles.managerBox}>

                    <label htmlFor="managerName">
                      현재 오스템 담당자 이름
                    </label>


                    <input
                      id="managerName"

                      type="text"

                      maxLength={50}

                      autoComplete="off"

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

                  </div>

                )}

              </div>

            </section>

          )}

        </div>


        {/* =================================================
            선택 요약
        ================================================= */}

        {selectedCategories.length >
          0 && (

          <div className={styles.selectionSummary}>

            <span>
              선택한 상담
            </span>


            <div>

              {selectedCategories.map(
                (category) => {
                  const info =
                    CATEGORY_INFO[
                      category
                    ];


                  return (
                    <strong
                      key={
                        category
                      }
                    >
                      {info.emoji}{" "}
                      {info.title}
                    </strong>
                  );
                }
              )}

            </div>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (

          <div className={styles.errorMessage}>
            {errorMessage}
          </div>

        )}


        {/* =================================================
            ★ 반드시 화면에 표시되는 최종 버튼
        ================================================= */}

        <button
          type="button"

          className={styles.finalSubmitButton}

          disabled={
            submitting ||
            selectedCategories.length ===
              0
          }

          onClick={
            submitConsultation
          }
        >

          {submitting
            ? "상담 신청 중..."
            : selectedCategories.length >
              0
              ? `상담 신청하기 (${selectedCategories.length}개 선택)`
              : "상담 신청하기"}

        </button>


        {submitting && (

          <div className={styles.submittingBox}>

            <div className={styles.smallSpinner} />

            상담 신청을 저장하고 있습니다.

          </div>

        )}


        <p className={styles.privacyNote}>
          상담 신청 시 진단 과정에서 입력한
          연락처 및 담당자 정보가 상담 진행을 위해
          활용될 수 있습니다.
        </p>

      </div>

    </main>
  );
}
