"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./consultation.module.css";

const CATEGORY_OPTIONS = [
  {
    value: "location",
    emoji: "📍",
    title: "입지",
    description: "개원 후보지와 상권·입지를 함께 검토합니다.",
  },
  {
    value: "process",
    emoji: "📋",
    title: "프로세스 상담",
    description: "개원 준비 순서와 전체 진행 과정을 상담합니다.",
  },
  {
    value: "major_equipment",
    emoji: "🦷",
    title: "대장비",
    description: "체어·CT 등 주요 장비 구성을 상담합니다.",
  },
  {
    value: "supplies",
    emoji: "🧰",
    title: "소장비·기구·재료",
    description: "개원에 필요한 소장비·기구·재료를 상담합니다.",
  },
];

const LOCATION_STATUS_OPTIONS = [
  {
    value: "completed",
    label: "완료",
  },
  {
    value: "in_progress",
    label: "진행중",
  },
  {
    value: "planned",
    label: "추후예정",
  },
];

const OPENING_TYPE_OPTIONS = [
  {
    value: "new_opening",
    label: "신규개원",
  },
  {
    value: "relocation",
    label: "이전개원",
  },
  {
    value: "acquisition",
    label: "신규개원(인수)",
  },
  {
    value: "reopening",
    label: "이전개원(인수)",
  },
  {
    value: "expansion",
    label: "확장개원",
  },
];

function readResultState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      "openingProfileResultState"
    );

    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Result session parse error:", error);
    return null;
  }
}

function getResponseId(state) {
  return (
    state?.responseId ||
    state?.diagnosisResponseId ||
    state?.diagnosis_response_id ||
    state?.id ||
    state?.response?.id ||
    state?.diagnosis?.id ||
    ""
  );
}

export default function ConsultationPage() {
  const router = useRouter();

  const [responseId, setResponseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [resultEmail, setResultEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [hasSalesManager, setHasSalesManager] =
    useState(false);
  const [salesManagerName, setSalesManagerName] =
    useState("");

  const [openingTypes, setOpeningTypes] =
    useState([]);
  const [desiredRegion, setDesiredRegion] =
    useState("");
  const [plannedOpeningYear, setPlannedOpeningYear] =
    useState("");
  const [plannedOpeningMonth, setPlannedOpeningMonth] =
    useState("");
  const [locationSelectionStatus, setLocationSelectionStatus] =
    useState("");
  const [chairCount, setChairCount] =
    useState("");

  const [selectedCategories, setSelectedCategories] =
    useState([]);
  const [needsManagerMatching, setNeedsManagerMatching] =
    useState(null);
  const [managerName, setManagerName] = useState("");
  const [memo, setMemo] = useState("");
  const [consultantName, setConsultantName] =
    useState("");

  const hasNonLocation = useMemo(
    () =>
      selectedCategories.some(
        (category) => category !== "location"
      ),
    [selectedCategories]
  );

  const showManagerMatching =
    !hasSalesManager && hasNonLocation;

  useEffect(() => {
    async function load() {
      const state = readResultState();
      const id = String(getResponseId(state) || "").trim();

      setResultEmail(
        typeof state?.resultEmail === "string"
          ? state.resultEmail
          : ""
      );

      if (!id) {
        setErrorMessage(
          "완료된 진단 결과를 확인할 수 없습니다."
        );
        setLoading(false);
        return;
      }

      setResponseId(id);

      try {
        const response = await fetch(
          `/api/consultation?responseId=${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "상담 정보를 불러오지 못했습니다."
          );
        }

        const diagnosis = result.diagnosis || {};
        const consultation = result.consultation || null;

        setHasSalesManager(
          diagnosis.has_sales_manager === true
        );
        setSalesManagerName(
          diagnosis.sales_manager_name || ""
        );

        if (consultation) {
          setOpeningTypes(
            Array.isArray(consultation.opening_types)
              ? consultation.opening_types.map(
                  (type) =>
                    type === "confirmed"
                      ? "expansion"
                      : type
                )
              : []
          );
          setDesiredRegion(
            consultation.desired_region || ""
          );
          setPlannedOpeningYear(
            consultation.planned_opening_year
              ? String(
                  consultation.planned_opening_year
                )
              : ""
          );
          setPlannedOpeningMonth(
            consultation.planned_opening_month
              ? String(
                  consultation.planned_opening_month
                )
              : ""
          );
          setLocationSelectionStatus(
            consultation.location_selection_status || ""
          );
          setChairCount(
            consultation.chair_count
              ? String(consultation.chair_count)
              : ""
          );
          setSelectedCategories(
            Array.isArray(consultation.categories)
              ? consultation.categories
              : []
          );
          setNeedsManagerMatching(
            typeof consultation.needs_manager_matching ===
              "boolean"
              ? consultation.needs_manager_matching
              : null
          );
          setManagerName(
            consultation.manager_name || ""
          );
          setMemo(consultation.memo || "");
          setConsultantName(
            consultation.consultant_name || ""
          );
        }
      } catch (error) {
        console.error("Consultation load error:", error);
        setErrorMessage(
          error.message ||
            "상담 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!showManagerMatching) {
      setNeedsManagerMatching(null);
      setManagerName("");
    }
  }, [showManagerMatching]);

  function toggleOpeningType(value) {
    setOpeningTypes((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  }

  function toggleCategory(value) {
    setSelectedCategories((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  }

  function handleYearChange(event) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setPlannedOpeningYear(value);
  }

  function handleMonthChange(event) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 2);

    setPlannedOpeningMonth(value);
  }

  function handleChairCountChange(event) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 3);

    setChairCount(value);
  }

  async function sendResultEmail() {
    setEmailError("");
    setEmailSuccess("");

    const email = resultEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(
        "이메일 주소를 정확하게 입력해주세요."
      );
      return;
    }

    if (!responseId) {
      setEmailError(
        "진단 결과 정보를 확인할 수 없습니다."
      );
      return;
    }

    try {
      setEmailSending(true);

      const response = await fetch(
        "/api/result/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            responseId,
            email,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "이메일 발송에 실패했습니다."
        );
      }

      setEmailSuccess(
        "상세 진단 결과를 이메일로 보내드렸습니다."
      );

      if (typeof window !== "undefined") {
        try {
          const raw = window.sessionStorage.getItem(
            "openingProfileResultState"
          );

          if (raw) {
            const stored = JSON.parse(raw);

            window.sessionStorage.setItem(
              "openingProfileResultState",
              JSON.stringify({
                ...stored,
                resultEmail: email,
              })
            );
          }
        } catch (storageError) {
          console.error(
            "Result email session update error:",
            storageError
          );
        }
      }
    } catch (error) {
      setEmailError(
        error.message ||
          "이메일 발송에 실패했습니다."
      );
    } finally {
      setEmailSending(false);
    }
  }

  function goBackToResult() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "openingProfileReturnToResult",
        "1"
      );
    }

    router.push("/");
  }

  function validate() {
    if (openingTypes.length === 0) {
      return "개원종류를 한 가지 이상 선택해주세요.";
    }

    if (!desiredRegion.trim()) {
      return "개원 희망 지역을 입력해주세요.";
    }

    const year = Number(plannedOpeningYear);
    const month = Number(plannedOpeningMonth);

    if (
      plannedOpeningYear.length !== 4 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2999
    ) {
      return "개원 예정 연도를 4자리 숫자로 입력해주세요.";
    }

    if (
      !plannedOpeningMonth ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return "개원 예정 월을 1~12 사이 숫자로 입력해주세요.";
    }

    if (!locationSelectionStatus) {
      return "입지선정 상태를 선택해주세요.";
    }

    if (chairCount) {
      const chairs = Number(chairCount);

      if (
        !Number.isInteger(chairs) ||
        chairs < 1 ||
        chairs > 999
      ) {
        return "체어규모를 1~999 사이 숫자로 입력해주세요.";
      }
    }

    if (selectedCategories.length === 0) {
      return "희망 상담을 한 가지 이상 선택해주세요.";
    }

    if (showManagerMatching) {
      if (typeof needsManagerMatching !== "boolean") {
        return "영업담당자 매칭 필요 여부를 선택해주세요.";
      }

      if (
        needsManagerMatching === false &&
        !managerName.trim()
      ) {
        return "현재 오스템 영업담당자 이름을 입력해주세요.";
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/consultation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diagnosisResponseId: responseId,
            openingTypes,
            desiredRegion: desiredRegion.trim(),
            plannedOpeningYear:
              Number(plannedOpeningYear),
            plannedOpeningMonth:
              Number(plannedOpeningMonth),
            locationSelectionStatus,
            chairCount:
              chairCount
                ? Number(chairCount)
                : null,
            categories: selectedCategories,
            needsManagerMatching:
              showManagerMatching
                ? needsManagerMatching
                : false,
            managerName:
              showManagerMatching &&
              needsManagerMatching === false
                ? managerName.trim()
                : "",
            memo: memo.trim(),
            consultantName: consultantName.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "상담 신청 저장에 실패했습니다."
        );
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "openingProfileConsultationCompleted",
          "1"
        );
        window.sessionStorage.setItem(
          "openingProfileReturnToResult",
          "1"
        );
      }

      window.alert("상담 신청이 완료되었습니다.");
      router.push("/");
    } catch (error) {
      console.error("Consultation submit error:", error);
      setErrorMessage(
        error.message ||
          "상담 신청 처리 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingCard}>
          상담 정보를 불러오고 있습니다.
        </div>
      </main>
    );
  }

  if (!responseId || (errorMessage && !responseId)) {
    return (
      <main className={styles.page}>
        <div className={styles.invalidCard}>
          <div className={styles.invalidIcon}>🦷</div>
          <p className={styles.brand}>OSSTEM IMPLANT</p>
          <h1>진단 결과를 확인할 수 없습니다.</h1>
          <p>{errorMessage}</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => router.push("/")}
          >
            처음으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={goBackToResult}
          >
            ← 이전
          </button>

          <p className={styles.brand}>OSSTEM IMPLANT</p>
          <h1>개원 상담 신청</h1>
          <p className={styles.intro}>
            개원 계획과 필요한 상담 항목을 남겨주시면
            확인 후 상담을 도와드립니다.
          </p>
        </header>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <span>01</span>
              <div>
                <h2>개원 기본 정보</h2>
                <p>
                  현재 계획하고 계신 개원 정보를
                  입력해주세요.
                </p>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>
                개원종류
                <em>필수</em>
              </div>

              <div className={styles.openingTypeOptions}>
                {OPENING_TYPE_OPTIONS.map((option) => {
                  const checked =
                    openingTypes.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={
                        checked
                          ? styles.statusOptionActive
                          : styles.statusOption
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleOpeningType(option.value)
                        }
                      />
                      <span className={styles.checkVisual}>
                        {checked ? "✓" : ""}
                      </span>
                      <strong>{option.label}</strong>
                    </label>
                  );
                })}
              </div>

              <p className={styles.helperText}>
                해당되는 항목을 모두 선택할 수 있습니다.
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <label
                className={styles.fieldLabel}
                htmlFor="desiredRegion"
              >
                개원 희망 지역
                <em>필수</em>
              </label>
              <input
                id="desiredRegion"
                className={styles.textInput}
                type="text"
                maxLength={120}
                value={desiredRegion}
                onChange={(event) =>
                  setDesiredRegion(event.target.value)
                }
                placeholder="예: 서울 강남구, 부산 해운대구"
              />

              <p className={styles.helperText}>
                00동까지 자세하게 적어주시면 더 정확한 상담이 가능합니다.
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                개원 예정시기
                <em>필수</em>
              </label>

              <div className={styles.dateInputs}>
                <label>
                  <input
                    className={styles.numberInput}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={plannedOpeningYear}
                    onChange={handleYearChange}
                    placeholder="2027"
                    aria-label="개원 예정 연도"
                  />
                  <span>년</span>
                </label>

                <label>
                  <input
                    className={styles.numberInput}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={plannedOpeningMonth}
                    onChange={handleMonthChange}
                    placeholder="3"
                    aria-label="개원 예정 월"
                  />
                  <span>월</span>
                </label>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>
                입지선정
                <em>필수</em>
              </div>

              <div className={styles.statusOptions}>
                {LOCATION_STATUS_OPTIONS.map((option) => {
                  const checked =
                    locationSelectionStatus ===
                    option.value;

                  return (
                    <label
                      key={option.value}
                      className={
                        checked
                          ? styles.statusOptionActive
                          : styles.statusOption
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setLocationSelectionStatus(
                            checked ? "" : option.value
                          )
                        }
                      />
                      <span className={styles.checkVisual}>
                        {checked ? "✓" : ""}
                      </span>
                      <strong>{option.label}</strong>
                    </label>
                  );
                })}
              </div>

              <p className={styles.helperText}>
                한 가지 상태만 선택할 수 있습니다.
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>
                체어규모
              </div>

              <label className={styles.chairScaleRow}>
                <span>(</span>
                <input
                  className={styles.chairCountInput}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={chairCount}
                  onChange={handleChairCountChange}
                  aria-label="체어규모"
                />
                <span>)대</span>
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <span>02</span>
              <div>
                <h2>희망 상담</h2>
                <p>
                  필요한 상담을 모두 선택해주세요.
                </p>
              </div>
            </div>

            <div className={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((option) => {
                const selected =
                  selectedCategories.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      selected
                        ? styles.categoryCardActive
                        : styles.categoryCard
                    }
                    onClick={() =>
                      toggleCategory(option.value)
                    }
                    aria-pressed={selected}
                  >
                    <span className={styles.categoryEmoji}>
                      {option.emoji}
                    </span>
                    <span className={styles.categoryText}>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                    <span className={styles.categoryCheck}>
                      {selected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {hasSalesManager && (
            <section className={styles.managerNotice}>
              <span>👤</span>
              <div>
                <strong>기존 영업담당자가 확인되었습니다.</strong>
                <p>
                  {salesManagerName
                    ? `${salesManagerName} 담당자와 연결된 상태입니다.`
                    : "기존 영업담당자와 연결된 상태입니다."}
                </p>
              </div>
            </section>
          )}

          {showManagerMatching && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <span>03</span>
                <div>
                  <h2>영업담당자 매칭</h2>
                  <p>
                    입지 외 상담 진행을 위한 담당자 매칭
                    여부를 선택해주세요.
                  </p>
                </div>
              </div>

              <div className={styles.matchingOptions}>
                <button
                  type="button"
                  className={
                    needsManagerMatching === true
                      ? styles.matchingOptionActive
                      : styles.matchingOption
                  }
                  onClick={() => {
                    setNeedsManagerMatching(true);
                    setManagerName("");
                  }}
                >
                  <span>✓</span>
                  <div>
                    <strong>필요합니다</strong>
                    <small>
                      새로운 오스템 영업담당자 매칭을
                      요청합니다.
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    needsManagerMatching === false
                      ? styles.matchingOptionActive
                      : styles.matchingOption
                  }
                  onClick={() =>
                    setNeedsManagerMatching(false)
                  }
                >
                  <span>✓</span>
                  <div>
                    <strong>필요하지 않습니다</strong>
                    <small>
                      현재 상담 중인 오스템 영업담당자가
                      있습니다.
                    </small>
                  </div>
                </button>
              </div>

              {needsManagerMatching === false && (
                <div className={styles.fieldGroup}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="managerName"
                  >
                    현재 오스템 영업담당자 이름
                    <em>필수</em>
                  </label>
                  <input
                    id="managerName"
                    className={styles.textInput}
                    type="text"
                    maxLength={80}
                    value={managerName}
                    onChange={(event) =>
                      setManagerName(event.target.value)
                    }
                    placeholder="영업담당자 이름을 입력해주세요."
                  />
                </div>
              )}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <span>{showManagerMatching ? "04" : "03"}</span>
              <div>
                <h2>메모</h2>
                <p>
                  상담 시 참고할 내용이 있으면 자유롭게
                  남겨주세요.
                </p>
              </div>
            </div>

            <textarea
              className={styles.memoInput}
              value={memo}
              onChange={(event) =>
                setMemo(
                  event.target.value.slice(0, 2000)
                )
              }
              placeholder="예: 2027년 상반기 개원 목표, 30평대 후보지 검토 중"
              rows={5}
            />
            <div className={styles.memoCount}>
              {memo.length} / 2000
            </div>

            <label className={styles.consultantRow}>
              <span>상담자 (</span>
              <input
                className={styles.consultantInput}
                type="text"
                maxLength={50}
                autoComplete="off"
                value={consultantName}
                onChange={(event) =>
                  setConsultantName(event.target.value)
                }
                aria-label="상담자"
              />
              <span>)</span>
            </label>
          </section>

          {errorMessage && (
            <div className={styles.errorBox}>
              {errorMessage}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={goBackToResult}
              disabled={submitting}
            >
              ← 이전
            </button>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={submitting}
            >
              {submitting
                ? "신청 저장 중..."
                : `상담 신청하기 (${selectedCategories.length}개 선택)`}
            </button>
          </div>
        </form>

        <section className={styles.emailCard}>
          <div className={styles.emailHead}>
            <span>📧</span>

            <div>
              <h3>결과 이메일로 받기</h3>
              <p>
                지금 확인한 기본성향 +
                복합성향 상세 분석을
                이메일로 받아보세요.
              </p>
            </div>
          </div>

          <input
            className={styles.emailInput}
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
            <div className={styles.emailError}>
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className={styles.emailSuccess}>
              ✓ {emailSuccess}
            </div>
          )}

          <button
            type="button"
            className={styles.emailButton}
            disabled={emailSending}
            onClick={sendResultEmail}
          >
            {emailSending
              ? "이메일 발송 중..."
              : "📧 상세 결과 이메일로 받기"}
          </button>

          <p className={styles.emailPrivacyNote}>
            입력한 이메일 주소는 결과 발송에만
            사용되며 진단 DB에는 별도로 저장하지 않습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
