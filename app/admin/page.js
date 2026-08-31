"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@supabase/supabase-js";

import styles from "./dashboard.module.css";

import {
  TYPE_INFO,
  QUESTIONS,
  getTypeKeyFromLabel,
  getCombinationInfo,
  getCombinationStrength,
} from "../lib/diagnosisData";


/* =========================================================
   상담 종류
========================================================= */

const CATEGORY = {
  location: {
    emoji: "📍",
    label: "입지",
  },

  major_equipment: {
    emoji: "🦷",
    label: "대장비",
  },

  supplies: {
    emoji: "🧰",
    label: "소장비·기구·재료",
  },
};


/* =========================================================
   상담 상태
========================================================= */

const STATUS = {
  new:
    "신규",

  reviewing:
    "확인중",

  assigned:
    "담당자 배정",

  completed:
    "상담 완료",
};


/* =========================================================
   Supabase
========================================================= */

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;


const supabasePublicKey =
  process.env
    .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY;


const supabase =
  supabaseUrl &&
  supabasePublicKey
    ? createClient(
        supabaseUrl,
        supabasePublicKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      )
    : null;


/* =========================================================
   날짜
========================================================= */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      "ko-KR",
      {
        timeZone:
          "Asia/Seoul",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "-";
  }
}


/* =========================================================
   질문 개수
========================================================= */

function questionCount(
  answers
) {
  if (
    !answers ||
    typeof answers !==
      "object"
  ) {
    return 0;
  }

  return Object.keys(
    answers
  ).filter(
    (key) =>
      /^q\d+$/.test(
        key
      )
  ).length;
}


/* =========================================================
   진단 Meta
========================================================= */

function getMeta(item) {
  const primaryType =
    item.result_type
      ? getTypeKeyFromLabel(
          item.result_type
        )
      : null;


  const secondaryType =
    item.secondary_type
      ? getTypeKeyFromLabel(
          item.secondary_type
        )
      : null;


  const combination =
    primaryType &&
    secondaryType
      ? getCombinationInfo(
          primaryType,
          secondaryType
        )
      : null;


  const strength =
    combination
      ? getCombinationStrength(
          item.result_score,
          item.secondary_score
        )
      : null;


  const count =
    questionCount(
      item.answers
    );


  return {
    primaryType,
    secondaryType,
    combination,
    strength,

    version:
      count >= 12
        ? "12문항"
        : count > 0
          ? `${count}문항 이전`
          : "미완료",
  };
}


/* =========================================================
   ADMIN
========================================================= */

export default function AdminPage() {
  const router =
    useRouter();


  const [
    rows,
    setRows,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    consultationFilter,
    setConsultationFilter,
  ] =
    useState(
      "all"
    );


  const [
    managerFilter,
    setManagerFilter,
  ] =
    useState(
      "all"
    );


  const [
    expanded,
    setExpanded,
  ] =
    useState(null);


  const [
    updating,
    setUpdating,
  ] =
    useState(null);


  const [
    exporting,
    setExporting,
  ] =
    useState(false);


  /* =======================================================
     TOKEN
  ======================================================= */

  async function getAccessToken() {
    if (!supabase) {
      return null;
    }

    const {
      data,
    } =
      await supabase.auth
        .getSession();

    return (
      data?.session
        ?.access_token ||
      null
    );
  }


  /* =======================================================
     LOAD
  ======================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!supabase) {
        throw new Error(
          "Supabase 연결 정보를 확인해주세요."
        );
      }

      const accessToken =
        await getAccessToken();

      if (!accessToken) {
        router.replace(
          "/admin/login"
        );

        return;
      }

      const response =
        await fetch(
          "/api/admin/responses",
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },

            cache:
              "no-store",
          }
        );


      const result =
        await response.json();


      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        await supabase.auth
          .signOut();

        router.replace(
          "/admin/login"
        );

        return;
      }


      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "데이터를 불러오지 못했습니다."
        );
      }


      setRows(
        result.items ||
        []
      );

    } catch (error) {
      console.error(
        error
      );

      setErrorMessage(
        error.message ||
        "관리자 데이터를 불러오지 못했습니다."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(
    () => {
      loadData();
    },
    []
  );


  /* =======================================================
     ENRICHED
  ======================================================= */

  const enriched =
    useMemo(
      () =>
        rows.map(
          (item) => ({
            ...item,

            meta:
              getMeta(
                item
              ),
          })
        ),
      [rows]
    );


  /* =======================================================
     영업담당자 목록
  ======================================================= */

  const salesManagerNames =
    useMemo(
      () => {
        const names =
          enriched
            .filter(
              (item) =>
                item.has_sales_manager ===
                  true &&
                item.sales_manager_name
                  ?.trim()
            )
            .map(
              (item) =>
                item.sales_manager_name
                  .trim()
            );


        return [
          ...new Set(
            names
          ),
        ].sort(
          (a, b) =>
            a.localeCompare(
              b,
              "ko"
            )
        );
      },
      [enriched]
    );


  /* =======================================================
     전체 통계
  ======================================================= */

  const stats =
    useMemo(
      () => {
        const completed =
          enriched.filter(
            (item) =>
              item.completed
          );


        const consultation =
          enriched.filter(
            (item) =>
              item.consultation
          );


        const matching =
          consultation.filter(
            (item) =>
              item.consultation
                ?.needs_manager_matching ===
              true
          );


        return {
          total:
            enriched.length,

          completed:
            completed.length,

          consultation:
            consultation.length,

          matching:
            matching.length,
        };
      },
      [enriched]
    );


  /* =======================================================
     ★ 담당자별 상담 현황
  ======================================================= */

  const managerStats =
    useMemo(
      () => {
        const managerMap =
          new Map();


        enriched.forEach(
          (item) => {
            /*
              기존 영업담당자가 있는 사람만
              담당자별 통계에 포함
            */

            if (
              item.has_sales_manager !==
                true ||
              !item.sales_manager_name
                ?.trim()
            ) {
              return;
            }


            const managerName =
              item.sales_manager_name
                .trim();


            if (
              !managerMap.has(
                managerName
              )
            ) {
              managerMap.set(
                managerName,
                {
                  name:
                    managerName,

                  totalCustomers:
                    0,

                  consultationCount:
                    0,

                  location:
                    0,

                  majorEquipment:
                    0,

                  supplies:
                    0,

                  newCount:
                    0,

                  reviewing:
                    0,

                  assigned:
                    0,

                  completed:
                    0,
                }
              );
            }


            const stat =
              managerMap.get(
                managerName
              );


            stat.totalCustomers +=
              1;


            if (
              !item.consultation
            ) {
              return;
            }


            stat.consultationCount +=
              1;


            if (
              item.consultation
                .category ===
              "location"
            ) {
              stat.location +=
                1;
            }


            if (
              item.consultation
                .category ===
              "major_equipment"
            ) {
              stat.majorEquipment +=
                1;
            }


            if (
              item.consultation
                .category ===
              "supplies"
            ) {
              stat.supplies +=
                1;
            }


            if (
              item.consultation
                .status ===
              "new"
            ) {
              stat.newCount +=
                1;
            }


            if (
              item.consultation
                .status ===
              "reviewing"
            ) {
              stat.reviewing +=
                1;
            }


            if (
              item.consultation
                .status ===
              "assigned"
            ) {
              stat.assigned +=
                1;
            }


            if (
              item.consultation
                .status ===
              "completed"
            ) {
              stat.completed +=
                1;
            }
          }
        );


        return Array.from(
          managerMap.values()
        ).sort(
          (
            a,
            b
          ) => {
            /*
              상담 신청 많은 담당자 순
            */

            if (
              b.consultationCount !==
              a.consultationCount
            ) {
              return (
                b.consultationCount -
                a.consultationCount
              );
            }


            return a.name.localeCompare(
              b.name,
              "ko"
            );
          }
        );
      },
      [enriched]
    );


  /* =======================================================
     미담당자 / 매칭 필요 통계
  ======================================================= */

  const noManagerStats =
    useMemo(
      () => {
        const noManager =
          enriched.filter(
            (item) =>
              item.has_sales_manager ===
              false
          );


        const consultation =
          noManager.filter(
            (item) =>
              item.consultation
          );


        const matching =
          consultation.filter(
            (item) =>
              item.consultation
                ?.needs_manager_matching ===
              true
          );


        return {
          customers:
            noManager.length,

          consultation:
            consultation.length,

          matching:
            matching.length,
        };
      },
      [enriched]
    );


  /* =======================================================
     FILTER
  ======================================================= */

  const filtered =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return enriched.filter(
          (item) => {
            /*
              검색
            */

            if (keyword) {
              const searchable =
                [
                  item.name,
                  item.phone,
                  item.license_number,

                  item.result_type,
                  item.secondary_type,

                  item.meta
                    .combination
                    ?.name,

                  item.sales_manager_name,

                  item.consultation
                    ?.manager_name,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              if (
                !searchable.includes(
                  keyword
                )
              ) {
                return false;
              }
            }


            /*
              상담 필터
            */

            if (
              consultationFilter ===
                "applied" &&
              !item.consultation
            ) {
              return false;
            }


            if (
              consultationFilter ===
                "not_applied" &&
              item.consultation
            ) {
              return false;
            }


            if (
              consultationFilter ===
                "matching" &&
              item.consultation
                ?.needs_manager_matching !==
                true
            ) {
              return false;
            }


            if (
              [
                "location",
                "major_equipment",
                "supplies",
              ].includes(
                consultationFilter
              ) &&
              item.consultation
                ?.category !==
                consultationFilter
            ) {
              return false;
            }


            /*
              영업담당자 필터
            */

            if (
              managerFilter ===
              "none"
            ) {
              if (
                item.has_sales_manager !==
                false
              ) {
                return false;
              }
            }


            if (
              managerFilter !==
                "all" &&
              managerFilter !==
                "none"
            ) {
              if (
                item.sales_manager_name
                  ?.trim() !==
                managerFilter
              ) {
                return false;
              }
            }


            return true;
          }
        );
      },
      [
        enriched,
        search,
        consultationFilter,
        managerFilter,
      ]
    );


  /* =======================================================
     상담 상태 변경
  ======================================================= */

  async function updateStatus(
    item,
    status
  ) {
    if (
      !item.consultation
    ) {
      return;
    }


    try {
      setUpdating(
        item.consultation.id
      );


      const accessToken =
        await getAccessToken();


      const response =
        await fetch(
          "/api/admin/consultations/status",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                consultationId:
                  item.consultation.id,

                status,
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
          "상태 변경에 실패했습니다."
        );
      }


      setRows(
        (previous) =>
          previous.map(
            (row) =>
              row.id ===
              item.id
                ? {
                    ...row,

                    consultation: {
                      ...row.consultation,

                      status,
                    },
                  }
                : row
          )
      );

    } catch (error) {
      alert(
        error.message ||
        "상담 상태를 변경하지 못했습니다."
      );

    } finally {
      setUpdating(
        null
      );
    }
  }


  /* =======================================================
     CSV
  ======================================================= */

  async function downloadCsv() {
    try {
      setExporting(true);


      const accessToken =
        await getAccessToken();


      if (!accessToken) {
        router.replace(
          "/admin/login"
        );

        return;
      }


      const response =
        await fetch(
          "/api/admin/export",
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );


      if (!response.ok) {
        throw new Error(
          "CSV 파일 생성에 실패했습니다."
        );
      }


      const blob =
        await response.blob();


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `opening-profile-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`;


      document.body
        .appendChild(
          link
        );


      link.click();
      link.remove();


      URL.revokeObjectURL(
        url
      );

    } catch (error) {
      alert(
        error.message ||
        "CSV 다운로드 중 오류가 발생했습니다."
      );

    } finally {
      setExporting(false);
    }
  }


  /* =======================================================
     로그아웃
  ======================================================= */

  async function handleLogout() {
    if (supabase) {
      await supabase.auth
        .signOut();
    }

    router.replace(
      "/admin/login"
    );
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className={styles.loading}>
        관리자 데이터를
        불러오고 있습니다.
      </main>
    );
  }


  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className={styles.page}>

      <div className={styles.container}>


        {/* ===============================================
            HEADER
        =============================================== */}

        <header className={styles.header}>

          <div>

            <p>
              OSSTEM IMPLANT
            </p>

            <h1>
              개원성향진단 관리자
            </h1>

            <span>
              진단 결과와 상담 신청,
              영업담당자별 현황을 관리합니다.
            </span>

          </div>


          <div className={styles.headerButtons}>

            <button
              type="button"
              className={styles.exportButton}
              disabled={exporting}
              onClick={
                downloadCsv
              }
            >
              {exporting
                ? "파일 생성 중..."
                : "↓ CSV 다운로드"}
            </button>


            <button
              type="button"
              className={styles.logoutButton}
              onClick={
                handleLogout
              }
            >
              로그아웃
            </button>

          </div>

        </header>


        {errorMessage && (

          <div className={styles.errorBox}>
            {errorMessage}
          </div>

        )}


        {/* ===============================================
            전체 통계
        =============================================== */}

        <div className={styles.stats}>

          <article>

            <span>
              전체 등록
            </span>

            <strong>
              {stats.total}
            </strong>

            <small>
              명
            </small>

          </article>


          <article>

            <span>
              진단 완료
            </span>

            <strong>
              {stats.completed}
            </strong>

            <small>
              명
            </small>

          </article>


          <article>

            <span>
              상담 신청
            </span>

            <strong>
              {stats.consultation}
            </strong>

            <small>
              건
            </small>

          </article>


          <article className={styles.orange}>

            <span>
              담당자 매칭 필요
            </span>

            <strong>
              {stats.matching}
            </strong>

            <small>
              건
            </small>

          </article>

        </div>


        {/* ===============================================
            ★ 담당자별 상담 신청 현황
        =============================================== */}

        <section className={styles.managerSection}>

          <div className={styles.sectionHeader}>

            <div>

              <p>
                SALES MANAGER
              </p>

              <h2>
                영업담당자별 상담 신청 현황
              </h2>

            </div>


            <span>
              담당자 이름을 기준으로 자동 집계합니다.
            </span>

          </div>


          {managerStats.length ===
          0 ? (

            <div className={styles.noManagerData}>
              아직 등록된 영업담당자 데이터가 없습니다.
            </div>

          ) : (

            <div className={styles.managerGrid}>

              {managerStats.map(
                (manager) => (

                  <article
                    key={
                      manager.name
                    }
                    className={
                      styles.managerCard
                    }
                  >

                    <div className={styles.managerHead}>

                      <div className={styles.managerAvatar}>
                        👤
                      </div>


                      <div>

                        <span>
                          OSSTEM SALES MANAGER
                        </span>

                        <h3>
                          {manager.name}
                        </h3>

                      </div>

                    </div>


                    <div className={styles.managerMainNumbers}>

                      <div>

                        <span>
                          담당 진단
                        </span>

                        <strong>
                          {manager.totalCustomers}
                        </strong>

                        <small>
                          명
                        </small>

                      </div>


                      <div>

                        <span>
                          상담 신청
                        </span>

                        <strong>
                          {manager.consultationCount}
                        </strong>

                        <small>
                          건
                        </small>

                      </div>

                    </div>


                    <div className={styles.managerCategoryGrid}>

                      <div>

                        <span>
                          📍 입지
                        </span>

                        <strong>
                          {manager.location}
                        </strong>

                      </div>


                      <div>

                        <span>
                          🦷 대장비
                        </span>

                        <strong>
                          {manager.majorEquipment}
                        </strong>

                      </div>


                      <div>

                        <span>
                          🧰 소장비·기구·재료
                        </span>

                        <strong>
                          {manager.supplies}
                        </strong>

                      </div>

                    </div>


                    <div className={styles.managerStatus}>

                      <div>

                        <span>
                          처리 전
                        </span>

                        <strong>
                          {
                            manager.newCount +
                            manager.reviewing +
                            manager.assigned
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          상담 완료
                        </span>

                        <strong>
                          {manager.completed}
                        </strong>

                      </div>

                    </div>


                    <button
                      type="button"

                      className={
                        styles.managerFilterButton
                      }

                      onClick={() => {
                        setManagerFilter(
                          manager.name
                        );

                        window.scrollTo({
                          top:
                            document.body
                              .scrollHeight,

                          behavior:
                            "smooth",
                        });
                      }}
                    >
                      {manager.name} 담당 고객 보기
                    </button>

                  </article>

                )
              )}

            </div>

          )}


          {/* 담당자 없음 */}

          <div className={styles.unassignedSummary}>

            <div>

              <span>
                영업담당자 없음
              </span>

              <strong>
                {noManagerStats.customers}명
              </strong>

            </div>


            <div>

              <span>
                상담 신청
              </span>

              <strong>
                {noManagerStats.consultation}건
              </strong>

            </div>


            <div>

              <span>
                지역 담당자 매칭 필요
              </span>

              <strong>
                {noManagerStats.matching}건
              </strong>

            </div>


            <button
              type="button"

              onClick={() =>
                setManagerFilter(
                  "none"
                )
              }
            >
              담당자 없는 고객 보기
            </button>

          </div>

        </section>


        {/* ===============================================
            FILTER
        =============================================== */}

        <div className={styles.filters}>

          <input
            type="search"

            placeholder="이름 · 연락처 · 면허번호 · 영업담당자 · 복합성향 검색"

            value={search}

            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
          />


          <select
            value={
              managerFilter
            }

            onChange={(
              event
            ) =>
              setManagerFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              전체 영업담당자
            </option>


            <option value="none">
              담당자 없음
            </option>


            {salesManagerNames.map(
              (name) => (
                <option
                  value={name}
                  key={name}
                >
                  {name}
                </option>
              )
            )}

          </select>


          <select
            value={
              consultationFilter
            }

            onChange={(
              event
            ) =>
              setConsultationFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              전체 상담
            </option>

            <option value="applied">
              상담 신청자
            </option>

            <option value="not_applied">
              상담 미신청
            </option>

            <option value="matching">
              담당자 매칭 필요
            </option>

            <option value="location">
              입지
            </option>

            <option value="major_equipment">
              대장비
            </option>

            <option value="supplies">
              소장비·기구·재료
            </option>

          </select>

        </div>


        <div className={styles.listHeader}>

          <h2>
            진단 참여자
          </h2>

          <strong>
            {filtered.length}건
          </strong>

        </div>


        {/* ===============================================
            TABLE
        =============================================== */}

        <div className={styles.tableWrap}>

          <table>

            <thead>

              <tr>

                <th>
                  참여자
                </th>

                <th>
                  영업담당자
                </th>

                <th>
                  진단결과
                </th>

                <th>
                  복합성향
                </th>

                <th>
                  상담
                </th>

                <th>
                  담당자 매칭
                </th>

                <th>
                  상담 상태
                </th>

                <th>
                  상세
                </th>

              </tr>

            </thead>


            <tbody>

              {filtered.length ===
              0 ? (

                <tr>

                  <td colSpan={8}>

                    <div className={styles.empty}>
                      조건에 맞는 데이터가 없습니다.
                    </div>

                  </td>

                </tr>

              ) : (

                filtered.map(
                  (item) => {
                    const primary =
                      item.meta
                        .primaryType
                        ? TYPE_INFO[
                            item.meta.primaryType
                          ]
                        : null;


                    const consultation =
                      item.consultation;


                    return (

                      <Fragment key={item.id}>


                        <tr>

                          <td>

                            <strong>
                              {item.name || "-"}
                            </strong>

                            <small>
                              {item.phone || "-"}
                            </small>

                          </td>


                          {/* 영업담당자 */}

                          <td>

                            {item.has_sales_manager ===
                              true &&
                            item.sales_manager_name ? (

                              <div className={styles.salesManagerCell}>

                                <span>
                                  👤
                                </span>

                                <div>

                                  <strong>
                                    {item.sales_manager_name}
                                  </strong>

                                  <small>
                                    기존 담당자
                                  </small>

                                </div>

                              </div>

                            ) : (

                              <span className={styles.noSalesManager}>
                                담당자 없음
                              </span>

                            )}

                          </td>


                          <td>

                            {primary
                              ? `${primary.emoji} ${primary.label}`
                              : "-"}

                          </td>


                          <td>

                            <strong className={styles.combo}>
                              {item.meta
                                .combination
                                ?.name ||
                                "-"}
                            </strong>

                          </td>


                          <td>

                            {consultation
                              ? `${CATEGORY[
                                  consultation.category
                                ]?.emoji || ""} ${
                                  CATEGORY[
                                    consultation.category
                                  ]?.label || ""
                                }`
                              : "-"}

                          </td>


                          <td>

                            {!consultation
                              ? "-"
                              : consultation.category ===
                                "location"
                                ? "해당없음"
                                : consultation
                                    .needs_manager_matching
                                  ? "필요"
                                  : "불필요"}

                          </td>


                          <td>

                            {consultation ? (

                              <select
                                className={
                                  styles.statusSelect
                                }

                                value={
                                  consultation.status
                                }

                                disabled={
                                  updating ===
                                  consultation.id
                                }

                                onChange={(
                                  event
                                ) =>
                                  updateStatus(
                                    item,
                                    event.target.value
                                  )
                                }
                              >

                                {Object.entries(
                                  STATUS
                                ).map(
                                  ([
                                    value,
                                    label,
                                  ]) => (
                                    <option
                                      key={value}
                                      value={value}
                                    >
                                      {label}
                                    </option>
                                  )
                                )}

                              </select>

                            ) : (
                              "-"
                            )}

                          </td>


                          <td>

                            <button
                              type="button"

                              className={
                                styles.detailButton
                              }

                              onClick={() =>
                                setExpanded(
                                  expanded ===
                                  item.id
                                    ? null
                                    : item.id
                                )
                              }
                            >
                              {expanded ===
                              item.id
                                ? "접기"
                                : "상세보기"}
                            </button>

                          </td>

                        </tr>


                        {/* ===================================
                            DETAIL
                        =================================== */}

                        {expanded ===
                          item.id && (

                          <tr>

                            <td
                              colSpan={8}
                              className={styles.expanded}
                            >

                              <div className={styles.detailPanel}>


                                {/* 기본 정보 */}

                                <section>

                                  <h3>
                                    참여자 정보
                                  </h3>


                                  <div className={styles.infoGrid}>

                                    <div>

                                      <span>
                                        이름
                                      </span>

                                      <strong>
                                        {item.name || "-"}
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        휴대폰
                                      </span>

                                      <strong>
                                        {item.phone || "-"}
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        면허번호
                                      </span>

                                      <strong>
                                        {item.license_number || "-"}
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        진단버전
                                      </span>

                                      <strong>
                                        {item.meta.version}
                                      </strong>

                                    </div>


                                    <div
                                      className={
                                        item.has_sales_manager
                                          ? styles.salesManagerInfo
                                          : ""
                                      }
                                    >

                                      <span>
                                        영업담당자 유무
                                      </span>

                                      <strong>
                                        {item.has_sales_manager ===
                                        true
                                          ? "있음"
                                          : "없음"}
                                      </strong>

                                    </div>


                                    <div
                                      className={
                                        item.has_sales_manager
                                          ? styles.salesManagerInfo
                                          : ""
                                      }
                                    >

                                      <span>
                                        오스템 영업담당자
                                      </span>

                                      <strong>
                                        {item.sales_manager_name ||
                                          "-"}
                                      </strong>

                                    </div>

                                  </div>

                                </section>


                                {/* 진단결과 */}

                                {item.completed &&
                                  primary && (

                                  <section>

                                    <h3>
                                      진단 결과
                                    </h3>


                                    <div className={styles.resultGrid}>

                                      <div>

                                        <span>
                                          주성향
                                        </span>

                                        <strong>
                                          {primary.emoji}{" "}
                                          {primary.label}
                                        </strong>

                                        <b>
                                          {item.result_score}점
                                        </b>

                                      </div>


                                      <div>

                                        <span>
                                          보조성향
                                        </span>

                                        <strong>
                                          {item.secondary_type ||
                                            "-"}
                                        </strong>

                                        <b>
                                          {item.secondary_score ??
                                            "-"}점
                                        </b>

                                      </div>


                                      <div>

                                        <span>
                                          복합성향
                                        </span>

                                        <strong>
                                          {item.meta
                                            .combination
                                            ?.name ||
                                            "-"}
                                        </strong>

                                        <b>
                                          {item.meta
                                            .strength
                                            ?.label ||
                                            ""}
                                        </b>

                                      </div>

                                    </div>

                                  </section>

                                )}


                                {/* 상담 */}

                                {consultation && (

                                  <section className={styles.consultationDetail}>

                                    <h3>
                                      상담 신청 내역
                                    </h3>


                                    <div className={styles.infoGrid}>

                                      <div>

                                        <span>
                                          희망 상담
                                        </span>

                                        <strong>
                                          {
                                            CATEGORY[
                                              consultation.category
                                            ]?.emoji
                                          }
                                          {" "}
                                          {
                                            CATEGORY[
                                              consultation.category
                                            ]?.label
                                          }
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          영업담당자
                                        </span>

                                        <strong>
                                          {item.sales_manager_name ||
                                            "없음"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          지역 담당자 매칭
                                        </span>

                                        <strong>
                                          {consultation.category ===
                                          "location"
                                            ? "해당없음"
                                            : consultation
                                                .needs_manager_matching
                                              ? "필요"
                                              : "불필요"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          상담에서 입력한 담당자
                                        </span>

                                        <strong>
                                          {consultation.manager_name ||
                                            "-"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          처리 상태
                                        </span>

                                        <strong>
                                          {STATUS[
                                            consultation.status
                                          ] || "-"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          신청일
                                        </span>

                                        <strong>
                                          {formatDate(
                                            consultation.created_at
                                          )}
                                        </strong>

                                      </div>

                                    </div>

                                  </section>

                                )}


                                {/* 문항 */}

                                <section>

                                  <h3>
                                    문항별 응답
                                  </h3>


                                  <div className={styles.answers}>

                                    {Array.from(
                                      {
                                        length: 12,
                                      },
                                      (
                                        _,
                                        index
                                      ) => {
                                        const entry =
                                          item.answers?.[
                                            `q${index + 1}`
                                          ];


                                        return (

                                          <article key={index}>

                                            <b>
                                              Q{index + 1}
                                            </b>


                                            <strong>
                                              {entry?.question ||
                                                QUESTIONS[
                                                  index
                                                ]?.question ||
                                                "-"}
                                            </strong>


                                            <p>
                                              {entry?.answer ||
                                                "응답 없음"}
                                            </p>

                                          </article>

                                        );
                                      }
                                    )}

                                  </div>

                                </section>

                              </div>

                            </td>

                          </tr>

                        )}

                      </Fragment>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}
