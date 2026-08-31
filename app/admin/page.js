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
  new: "신규",
  reviewing: "확인중",
  assigned: "담당자 배정",
  completed: "상담 완료",
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
   진단 META
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
    useState("all");


  const [
    managerFilter,
    setManagerFilter,
  ] =
    useState("all");


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
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


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
      setLoading(
        false
      );
    }
  }


  useEffect(
    () => {
      loadData();
    },
    []
  );


  /* =======================================================
     데이터 가공
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

     대형 담당자별 통계에는 사용하지 않고
     검색 필터에서만 사용
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
     상단 통계

     ★ 담당자 매칭 필요 유지
  ======================================================= */

  const stats =
    useMemo(
      () => {
        const completed =
          enriched.filter(
            (item) =>
              item.completed
          );


        const consultations =
          enriched.filter(
            (item) =>
              item.consultation
          );


        const matching =
          consultations.filter(
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
            consultations.length,

          matching:
            matching.length,
        };
      },
      [enriched]
    );


  /* =======================================================
     검색 / 필터
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

            /* 검색 */

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
                  .filter(
                    Boolean
                  )
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


            /* 상담 신청 여부 */

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


            /* ★ 담당자 매칭 필요 */

            if (
              consultationFilter ===
                "matching" &&
              item.consultation
                ?.needs_manager_matching !==
                true
            ) {
              return false;
            }


            /* 상담 분야 */

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


            /* 영업담당자 없음 */

            if (
              managerFilter ===
              "none"
            ) {
              if (
                item.has_sales_manager ===
                true
              ) {
                return false;
              }
            }


            /* 특정 영업담당자 */

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


      if (!accessToken) {
        router.replace(
          "/admin/login"
        );

        return;
      }


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
      setExporting(
        true
      );


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
      setExporting(
        false
      );
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
      <main
        className={
          styles.loading
        }
      >
        관리자 데이터를
        불러오고 있습니다.
      </main>
    );
  }


  /* =======================================================
     UI
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


        {/* ===============================================
            HEADER
        =============================================== */}

        <header
          className={
            styles.header
          }
        >

          <div>

            <p>
              OSSTEM IMPLANT
            </p>


            <h1>
              개원성향진단 관리자
            </h1>


            <span>
              진단 결과와 상담 신청 현황을
              관리합니다.
            </span>

          </div>


          <div
            className={
              styles.headerButtons
            }
          >

            <button
              type="button"

              className={
                styles.exportButton
              }

              disabled={
                exporting
              }

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

              className={
                styles.logoutButton
              }

              onClick={
                handleLogout
              }
            >
              로그아웃
            </button>

          </div>

        </header>


        {errorMessage && (
          <div
            className={
              styles.errorBox
            }
          >
            {errorMessage}
          </div>
        )}


        {/* ===============================================
            상단 통계

            ★ 담당자 매칭 필요 유지
        =============================================== */}

        <section
          className={
            styles.stats
          }
        >

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


          <article
            className={
              styles.matchingCard
            }
          >

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

        </section>


        {/* ===============================================
            검색/필터
        =============================================== */}

        <section
          className={
            styles.filters
          }
        >

          <div
            className={
              styles.searchBox
            }
          >

            <span>
              ⌕
            </span>


            <input
              type="search"

              placeholder="이름 · 연락처 · 면허번호 · 영업담당자 · 복합성향 검색"

              value={
                search
              }

              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


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
              영업담당자 없음
            </option>


            {salesManagerNames.map(
              (managerName) => (
                <option
                  key={
                    managerName
                  }

                  value={
                    managerName
                  }
                >
                  {managerName}
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
              상담 신청
            </option>

            <option value="not_applied">
              상담 미신청
            </option>

            <option value="matching">
              🔥 담당자 매칭 필요
            </option>

            <option value="location">
              📍 입지
            </option>

            <option value="major_equipment">
              🦷 대장비
            </option>

            <option value="supplies">
              🧰 소장비·기구·재료
            </option>

          </select>

        </section>


        {/* ===============================================
            매칭 필요 빠른 필터
        =============================================== */}

        <div
          className={
            styles.quickFilterRow
          }
        >

          <button
            type="button"

            className={
              consultationFilter ===
              "matching"
                ? styles.quickFilterActive
                : styles.quickFilterButton
            }

            onClick={() =>
              setConsultationFilter(
                consultationFilter ===
                "matching"
                  ? "all"
                  : "matching"
              )
            }
          >

            <span>
              🔥
            </span>

            담당자 매칭 필요

            <strong>
              {stats.matching}건
            </strong>

          </button>

        </div>


        {/* ===============================================
            LIST HEADER
        =============================================== */}

        <div
          className={
            styles.listHeader
          }
        >

          <div>

            <span>
              RESPONSE DATA
            </span>

            <h2>
              진단 참여자
            </h2>

          </div>


          <strong>
            {filtered.length}건
          </strong>

        </div>


        {/* ===============================================
            TABLE
        =============================================== */}

        <div
          className={
            styles.tableWrap
          }
        >

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

                  <td
                    colSpan={
                      8
                    }
                  >

                    <div
                      className={
                        styles.empty
                      }
                    >

                      <span>
                        🔎
                      </span>

                      <strong>
                        조건에 맞는 데이터가 없습니다.
                      </strong>

                      <p>
                        검색어 또는 필터를
                        변경해주세요.
                      </p>

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


                    const isMatchingNeeded =
                      consultation
                        ?.needs_manager_matching ===
                      true;


                    return (

                      <Fragment
                        key={
                          item.id
                        }
                      >


                        <tr
                          className={
                            isMatchingNeeded
                              ? styles.matchingRow
                              : ""
                          }
                        >

                          {/* 참여자 */}

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

                              <div
                                className={
                                  styles.salesManagerCell
                                }
                              >

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

                              <span
                                className={
                                  styles.noSalesManager
                                }
                              >
                                담당자 없음
                              </span>

                            )}

                          </td>


                          {/* 주성향 */}

                          <td>

                            {primary ? (

                              <div
                                className={
                                  styles.profileCell
                                }
                              >

                                <strong>
                                  {primary.emoji}{" "}
                                  {primary.label}
                                </strong>

                                <small>
                                  {item.result_score ?? "-"}점
                                </small>

                              </div>

                            ) : (
                              "-"
                            )}

                          </td>


                          {/* 복합성향 */}

                          <td>

                            <strong
                              className={
                                styles.combo
                              }
                            >
                              {item.meta
                                .combination
                                ?.name ||
                                "-"}
                            </strong>

                          </td>


                          {/* 상담 */}

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


                          {/* 담당자 매칭 */}

                          <td>

                            {!consultation ? (
                              "-"
                            ) : consultation.category ===
                              "location" ? (

                              <span
                                className={
                                  styles.notApplicableBadge
                                }
                              >
                                해당없음
                              </span>

                            ) : isMatchingNeeded ? (

                              <span
                                className={
                                  styles.matchingBadge
                                }
                              >
                                담당자 매칭 필요
                              </span>

                            ) : (

                              <span
                                className={
                                  styles.noMatchingBadge
                                }
                              >
                                매칭 불필요
                              </span>

                            )}

                          </td>


                          {/* 상담상태 */}

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
                                      key={
                                        value
                                      }

                                      value={
                                        value
                                      }
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
                            상세보기
                        =================================== */}

                        {expanded ===
                          item.id && (

                          <tr>

                            <td
                              colSpan={
                                8
                              }

                              className={
                                styles.expanded
                              }
                            >

                              <div
                                className={
                                  styles.detailPanel
                                }
                              >


                                {/* 참여자 */}

                                <section>

                                  <div
                                    className={
                                      styles.detailTitle
                                    }
                                  >

                                    <span>
                                      PARTICIPANT
                                    </span>

                                    <h3>
                                      참여자 정보
                                    </h3>

                                  </div>


                                  <div
                                    className={
                                      styles.infoGrid
                                    }
                                  >

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
                                          ? styles.managerHighlight
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
                                          ? styles.managerHighlight
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


                                {/* 진단 결과 */}

                                {item.completed &&
                                  primary && (

                                  <section>

                                    <div
                                      className={
                                        styles.detailTitle
                                      }
                                    >

                                      <span>
                                        DIAGNOSIS
                                      </span>

                                      <h3>
                                        진단 결과
                                      </h3>

                                    </div>


                                    <div
                                      className={
                                        styles.resultGrid
                                      }
                                    >

                                      <div>

                                        <span>
                                          주성향
                                        </span>

                                        <strong>
                                          {primary.emoji}{" "}
                                          {primary.label}
                                        </strong>

                                        <b>
                                          {item.result_score ?? "-"}점
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


                                {/* 상담 신청 */}

                                {consultation && (

                                  <section
                                    className={
                                      isMatchingNeeded
                                        ? styles.matchingConsultationDetail
                                        : styles.consultationDetail
                                    }
                                  >

                                    <div
                                      className={
                                        styles.detailTitle
                                      }
                                    >

                                      <span>
                                        CONSULTATION
                                      </span>

                                      <h3>
                                        상담 신청 내역
                                      </h3>

                                    </div>


                                    {isMatchingNeeded && (

                                      <div
                                        className={
                                          styles.matchingAlert
                                        }
                                      >
                                        🔥 지역 담당자 매칭이 필요한 상담입니다.
                                      </div>

                                    )}


                                    <div
                                      className={
                                        styles.infoGrid
                                      }
                                    >

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
                                          기존 영업담당자
                                        </span>

                                        <strong>
                                          {item.sales_manager_name ||
                                            "-"}
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
                                            : isMatchingNeeded
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
                                          처리상태
                                        </span>

                                        <strong>
                                          {STATUS[
                                            consultation.status
                                          ] ||
                                            "-"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          상담 신청일
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


                                {/* 질문 */}

                                <section>

                                  <div
                                    className={
                                      styles.detailTitle
                                    }
                                  >

                                    <span>
                                      ANSWERS
                                    </span>

                                    <h3>
                                      문항별 응답
                                    </h3>

                                  </div>


                                  <div
                                    className={
                                      styles.answers
                                    }
                                  >

                                    {Array.from(
                                      {
                                        length:
                                          12,
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

                                          <article
                                            key={
                                              index
                                            }
                                          >

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
