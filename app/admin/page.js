"use client";

import {
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

import styles from "./admin.module.css";

import {
  TYPE_INFO,
  QUESTIONS,
  getTypeKeyFromLabel,
  getCombinationInfo,
  getCombinationStrength,
} from "../lib/diagnosisData";


/* =========================================================
   Supabase Browser Client

   기존 로그인 세션과 같은 Supabase 프로젝트 사용
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
            persistSession:
              true,

            autoRefreshToken:
              true,

            detectSessionInUrl:
              true,
          },
        }
      )
    : null;


/* =========================================================
   날짜
========================================================= */

function formatDate(
  value
) {
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
   전화번호 마스킹용

   관리자 화면에서는 전체 번호를 보여주되
   아래 함수는 추후 마스킹 필요 시 사용 가능
========================================================= */

function safeText(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return String(value);
}


/* =========================================================
   질문 개수
========================================================= */

function getQuestionCount(
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
   진단 버전
========================================================= */

function getSurveyVersion(
  answers
) {
  const count =
    getQuestionCount(
      answers
    );


  if (
    count >= 12
  ) {
    return {
      label:
        "12문항",

      isNew:
        true,
    };
  }


  if (
    count > 0
  ) {
    return {
      label:
        `${count}문항 이전버전`,

      isNew:
        false,
    };
  }


  return {
    label:
      "미완료",

    isNew:
      false,
  };
}


/* =========================================================
   결과 분석
========================================================= */

function getResultMeta(
  item
) {
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


  const version =
    getSurveyVersion(
      item.answers
    );


  return {
    primaryType,
    secondaryType,
    combination,
    strength,
    version,
  };
}


/* =========================================================
   답변 정보
========================================================= */

function getAnswerEntry(
  answers,
  questionNumber
) {
  if (
    !answers ||
    typeof answers !==
      "object"
  ) {
    return null;
  }


  return (
    answers[
      `q${questionNumber}`
    ] || null
  );
}


function getAnswerText(
  entry
) {
  if (!entry) {
    return "-";
  }


  if (
    typeof entry ===
    "string"
  ) {
    return entry;
  }


  return (
    entry.answer ||
    entry.text ||
    "-"
  );
}


function getAnswerTypeLabel(
  entry
) {
  if (
    !entry ||
    typeof entry ===
      "string"
  ) {
    return "";
  }


  return (
    entry.typeLabel ||
    (
      entry.type &&
      TYPE_INFO[
        entry.type
      ]?.label
    ) ||
    ""
  );
}


/* =========================================================
   Admin
========================================================= */

export default function AdminPage() {
  const router =
    useRouter();


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
    rows,
    setRows,
  ] =
    useState([]);


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState("all");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");


  const [
    versionFilter,
    setVersionFilter,
  ] =
    useState("all");


  const [
    expandedId,
    setExpandedId,
  ] =
    useState(null);


  const [
    exporting,
    setExporting,
  ] =
    useState(false);


  /* =======================================================
     Access Token
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
     데이터 로드
  ======================================================= */

  async function loadResponses() {
    try {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


      if (!supabase) {
        throw new Error(
          "Supabase 연결 설정을 확인해주세요."
        );
      }


      const token =
        await getAccessToken();


      if (!token) {
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
                `Bearer ${token}`,
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
        "관리자 데이터를 불러오는 중 오류가 발생했습니다."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  useEffect(
    () => {
      loadResponses();
    },
    []
  );


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
     CSV
  ======================================================= */

  async function downloadCsv() {
    try {
      setExporting(
        true
      );


      const token =
        await getAccessToken();


      if (!token) {
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
                `Bearer ${token}`,
            },
          }
        );


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


      if (!response.ok) {
        throw new Error(
          "CSV 파일 생성에 실패했습니다."
        );
      }


      const blob =
        await response.blob();


      const objectUrl =
        URL.createObjectURL(
          blob
        );


      const date =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        objectUrl;


      link.download =
        `opening-profile-${date}.csv`;


      document.body
        .appendChild(
          link
        );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        objectUrl
      );

    } catch (error) {
      console.error(
        error
      );


      alert(
        error.message ||
        "다운로드 중 오류가 발생했습니다."
      );

    } finally {
      setExporting(
        false
      );
    }
  }


  /* =======================================================
     행 + 분석 정보
  ======================================================= */

  const enrichedRows =
    useMemo(
      () => {
        return rows.map(
          (item) => ({
            ...item,

            meta:
              getResultMeta(
                item
              ),
          })
        );
      },
      [
        rows,
      ]
    );


  /* =======================================================
     검색/필터
  ======================================================= */

  const filteredRows =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return enrichedRows.filter(
          (item) => {

            const meta =
              item.meta;


            if (keyword) {
              const searchable =
                [
                  item.name,
                  item.phone,
                  item.license_number,
                  item.result_type,
                  item.secondary_type,
                  meta.combination
                    ?.name,
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


            if (
              typeFilter !==
              "all"
            ) {
              if (
                meta.primaryType !==
                typeFilter
              ) {
                return false;
              }
            }


            if (
              statusFilter ===
              "completed" &&
              !item.completed
            ) {
              return false;
            }


            if (
              statusFilter ===
              "incomplete" &&
              item.completed
            ) {
              return false;
            }


            if (
              versionFilter ===
              "new" &&
              !meta.version
                .isNew
            ) {
              return false;
            }


            if (
              versionFilter ===
              "old" &&
              (
                meta.version
                  .isNew ||
                getQuestionCount(
                  item.answers
                ) === 0
              )
            ) {
              return false;
            }


            return true;
          }
        );
      },
      [
        enrichedRows,
        search,
        typeFilter,
        statusFilter,
        versionFilter,
      ]
    );


  /* =======================================================
     통계
  ======================================================= */

  const stats =
    useMemo(
      () => {
        const total =
          enrichedRows.length;


        const completed =
          enrichedRows.filter(
            (item) =>
              item.completed
          );


        const newVersion =
          completed.filter(
            (item) =>
              item.meta
                .version
                .isNew
          );


        const typeCounts = {
          stable:
            0,

          aggressive:
            0,

          analytical:
            0,

          pioneer:
            0,
        };


        completed.forEach(
          (item) => {
            const type =
              item.meta
                .primaryType;


            if (
              type &&
              typeCounts[type] !==
                undefined
            ) {
              typeCounts[
                type
              ] += 1;
            }
          }
        );


        /*
          복합성향 TOP은
          신규 12문항 진단만 집계

          이전 8문항과 신규 12문항의
          점수 체계가 다르기 때문
        */

        const combinationCounts =
          {};


        newVersion.forEach(
          (item) => {
            const name =
              item.meta
                .combination
                ?.name;


            if (!name) {
              return;
            }


            combinationCounts[
              name
            ] =
              (
                combinationCounts[
                  name
                ] || 0
              ) + 1;
          }
        );


        const topCombination =
          Object.entries(
            combinationCounts
          )
            .sort(
              (a, b) =>
                b[1] -
                a[1]
            )[0] ||
          null;


        return {
          total,

          completed:
            completed.length,

          newVersion:
            newVersion.length,

          typeCounts,

          topCombination,
        };
      },
      [
        enrichedRows,
      ]
    );


  /* =======================================================
     Loading
  ======================================================= */

  if (loading) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loadingCard
          }
        >
          <div
            className={
              styles.spinner
            }
          />

          <strong>
            관리자 데이터를
            불러오고 있습니다.
          </strong>
        </div>
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

            <p
              className={
                styles.eyebrow
              }
            >
              OSSTEM IMPLANT
            </p>

            <h1>
              개원성향진단
              관리자
            </h1>

            <p
              className={
                styles.headerDescription
              }
            >
              참여자 정보와
              기본성향·복합성향 및
              문항별 응답을 확인합니다.
            </p>

          </div>


          <div
            className={
              styles.headerActions
            }
          >

            <button
              type="button"

              className={
                styles.exportButton
              }

              onClick={
                downloadCsv
              }

              disabled={
                exporting
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


        {/* ===============================================
            ERROR
        =============================================== */}

        {errorMessage && (

          <div
            className={
              styles.errorBox
            }
          >

            <span>
              {errorMessage}
            </span>

            <button
              type="button"

              onClick={
                loadResponses
              }
            >
              다시 불러오기
            </button>

          </div>

        )}


        {/* ===============================================
            MAIN STATS
        =============================================== */}

        <section
          className={
            styles.statsGrid
          }
        >

          <article
            className={
              styles.statCard
            }
          >

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


          <article
            className={
              styles.statCard
            }
          >

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


          <article
            className={
              styles.statCard
            }
          >

            <span>
              신규 12문항
            </span>

            <strong>
              {stats.newVersion}
            </strong>

            <small>
              명
            </small>

          </article>


          <article
            className={`${styles.statCard} ${styles.comboStatCard}`}
          >

            <span>
              신규 복합성향 TOP
            </span>

            {stats.topCombination ? (
              <>

                <strong
                  className={
                    styles.comboStatName
                  }
                >
                  {
                    stats
                      .topCombination[0]
                  }
                </strong>

                <small>
                  {
                    stats
                      .topCombination[1]
                  }
                  명
                </small>

              </>
            ) : (

              <strong
                className={
                  styles.comboStatEmpty
                }
              >
                -
              </strong>

            )}

          </article>

        </section>


        {/* ===============================================
            기본성향 통계
        =============================================== */}

        <section
          className={
            styles.typeSection
          }
        >

          <div
            className={
              styles.sectionHeading
            }
          >

            <div>

              <span>
                PROFILE SUMMARY
              </span>

              <h2>
                기본성향 현황
              </h2>

            </div>

            <p>
              진단 완료자를 기준으로
              집계합니다.
            </p>

          </div>


          <div
            className={
              styles.typeGrid
            }
          >

            {Object.entries(
              TYPE_INFO
            ).map(
              ([
                type,
                info,
              ]) => (

                <article
                  className={
                    styles.typeCard
                  }

                  key={
                    type
                  }
                >

                  <span
                    className={
                      styles.typeEmoji
                    }
                  >
                    {
                      info.emoji
                    }
                  </span>


                  <div>

                    <span
                      className={
                        styles.typeName
                      }
                    >
                      {
                        info.label
                      }
                    </span>

                    <strong>
                      {
                        stats
                          .typeCounts[
                          type
                        ]
                      }
                      명
                    </strong>

                  </div>

                </article>

              )
            )}

          </div>

        </section>


        {/* ===============================================
            FILTER
        =============================================== */}

        <section
          className={
            styles.filterSection
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

              placeholder="이름 · 휴대폰 · 면허번호 · 복합성향 검색"

              value={
                search
              }

              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />

          </div>


          <select
            value={
              typeFilter
            }

            onChange={(
              event
            ) =>
              setTypeFilter(
                event.target
                  .value
              )
            }
          >

            <option value="all">
              전체 주성향
            </option>

            <option value="stable">
              🏠 안정정착형
            </option>

            <option value="aggressive">
              🚀 집중공격형
            </option>

            <option value="analytical">
              📊 데이터분석형
            </option>

            <option value="pioneer">
              🌱 선점개척형
            </option>

          </select>


          <select
            value={
              versionFilter
            }

            onChange={(
              event
            ) =>
              setVersionFilter(
                event.target
                  .value
              )
            }
          >

            <option value="all">
              전체 버전
            </option>

            <option value="new">
              신규 12문항
            </option>

            <option value="old">
              이전 버전
            </option>

          </select>


          <select
            value={
              statusFilter
            }

            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
          >

            <option value="all">
              전체 상태
            </option>

            <option value="completed">
              진단 완료
            </option>

            <option value="incomplete">
              미완료
            </option>

          </select>

        </section>


        {/* ===============================================
            LIST HEADER
        =============================================== */}

        <div
          className={
            styles.listHeading
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
            {
              filteredRows.length
            }
            건
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

          <table
            className={
              styles.table
            }
          >

            <thead>

              <tr>

                <th>
                  참여자
                </th>

                <th>
                  연락처
                </th>

                <th>
                  진단 버전
                </th>

                <th>
                  주성향
                </th>

                <th>
                  보조성향
                </th>

                <th>
                  복합성향
                </th>

                <th>
                  진단일
                </th>

                <th>
                  상세
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredRows.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={
                      8
                    }
                  >

                    <div
                      className={
                        styles.emptyState
                      }
                    >

                      <span>
                        🔎
                      </span>

                      <strong>
                        검색 결과가 없습니다.
                      </strong>

                      <p>
                        검색어 또는 필터를
                        변경해주세요.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredRows.map(
                  (
                    item
                  ) => {

                    const meta =
                      item.meta;


                    const primary =
                      meta.primaryType
                        ? TYPE_INFO[
                            meta
                              .primaryType
                          ]
                        : null;


                    const secondary =
                      meta.secondaryType
                        ? TYPE_INFO[
                            meta
                              .secondaryType
                          ]
                        : null;


                    const isExpanded =
                      expandedId ===
                      item.id;


                    const scores =
                      item.type_scores &&
                      typeof item.type_scores ===
                        "object"
                        ? item.type_scores
                        : {};


                    return (

                      <>
                        <tr
                          key={
                            item.id
                          }
                          className={
                            isExpanded
                              ? styles.activeRow
                              : ""
                          }
                        >

                          <td>

                            <div
                              className={
                                styles.personCell
                              }
                            >

                              <strong>
                                {
                                  safeText(
                                    item.name
                                  )
                                }
                              </strong>

                              <span>
                                면허번호{" "}
                                {
                                  safeText(
                                    item.license_number
                                  )
                                }
                              </span>

                            </div>

                          </td>


                          <td>
                            {
                              safeText(
                                item.phone
                              )
                            }
                          </td>


                          <td>

                            <span
                              className={
                                meta.version
                                  .isNew
                                  ? styles.newVersionBadge
                                  : styles.oldVersionBadge
                              }
                            >

                              {
                                meta.version
                                  .label
                              }

                            </span>

                          </td>


                          <td>

                            {primary ? (

                              <div
                                className={
                                  styles.profileCell
                                }
                              >

                                <strong>
                                  {
                                    primary.emoji
                                  }
                                  {" "}
                                  {
                                    primary.label
                                  }
                                </strong>

                                <span>
                                  {
                                    item.result_score ??
                                    "-"
                                  }
                                  점
                                </span>

                              </div>

                            ) : (
                              <span
                                className={
                                  styles.pending
                                }
                              >
                                미완료
                              </span>
                            )}

                          </td>


                          <td>

                            {secondary ? (

                              <div
                                className={
                                  styles.profileCell
                                }
                              >

                                <strong>
                                  {
                                    secondary.emoji
                                  }
                                  {" "}
                                  {
                                    secondary.label
                                  }
                                </strong>

                                <span>
                                  {
                                    item.secondary_score ??
                                    "-"
                                  }
                                  점
                                </span>

                              </div>

                            ) : (
                              "-"
                            )}

                          </td>


                          <td>

                            {meta.combination ? (

                              <div
                                className={
                                  styles.combinationCell
                                }
                              >

                                <strong>
                                  {
                                    meta.combination
                                      .name
                                  }
                                </strong>

                                <span>
                                  {
                                    meta.strength
                                      ?.label
                                  }
                                </span>

                              </div>

                            ) : (
                              "-"
                            )}

                          </td>


                          <td>

                            <div
                              className={
                                styles.dateCell
                              }
                            >

                              {
                                formatDate(
                                  item.completed_at ||
                                  item.created_at
                                )
                              }

                            </div>

                          </td>


                          <td>

                            <button
                              type="button"

                              className={
                                styles.detailButton
                              }

                              onClick={() =>
                                setExpandedId(
                                  isExpanded
                                    ? null
                                    : item.id
                                )
                              }
                            >

                              {isExpanded
                                ? "접기"
                                : "상세보기"}

                            </button>

                          </td>

                        </tr>


                        {isExpanded && (

                          <tr
                            key={`${item.id}-detail`}
                          >

                            <td
                              colSpan={
                                8
                              }

                              className={
                                styles.expandedCell
                              }
                            >

                              <div
                                className={
                                  styles.detailPanel
                                }
                              >

                                {/* ===================================
                                    개인 정보
                                =================================== */}

                                <section
                                  className={
                                    styles.detailBlock
                                  }
                                >

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
                                        {
                                          safeText(
                                            item.name
                                          )
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <span>
                                        휴대폰
                                      </span>

                                      <strong>
                                        {
                                          safeText(
                                            item.phone
                                          )
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <span>
                                        면허번호
                                      </span>

                                      <strong>
                                        {
                                          safeText(
                                            item.license_number
                                          )
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <span>
                                        진단버전
                                      </span>

                                      <strong>
                                        {
                                          meta.version
                                            .label
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <span>
                                        등록일
                                      </span>

                                      <strong>
                                        {
                                          formatDate(
                                            item.created_at
                                          )
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <span>
                                        완료일
                                      </span>

                                      <strong>
                                        {
                                          formatDate(
                                            item.completed_at
                                          )
                                        }
                                      </strong>
                                    </div>

                                  </div>

                                </section>


                                {/* ===================================
                                    결과
                                =================================== */}

                                {item.completed &&
                                  primary && (

                                  <section
                                    className={
                                      styles.detailBlock
                                    }
                                  >

                                    <div
                                      className={
                                        styles.detailTitle
                                      }
                                    >

                                      <span>
                                        DIAGNOSIS RESULT
                                      </span>

                                      <h3>
                                        진단 결과
                                      </h3>

                                    </div>


                                    <div
                                      className={
                                        styles.resultSummary
                                      }
                                    >

                                      <div
                                        className={
                                          styles.primaryResult
                                        }
                                      >

                                        <span>
                                          주성향
                                        </span>

                                        <strong>
                                          {
                                            primary.emoji
                                          }
                                          {" "}
                                          {
                                            primary.label
                                          }
                                        </strong>

                                        <b>
                                          {
                                            item.result_score
                                          }
                                          점
                                        </b>

                                      </div>


                                      {secondary && (

                                        <div
                                          className={
                                            styles.secondaryResult
                                          }
                                        >

                                          <span>
                                            보조성향
                                          </span>

                                          <strong>
                                            {
                                              secondary.emoji
                                            }
                                            {" "}
                                            {
                                              secondary.label
                                            }
                                          </strong>

                                          <b>
                                            {
                                              item.secondary_score
                                            }
                                            점
                                          </b>

                                        </div>

                                      )}

                                    </div>


                                    {meta.combination && (

                                      <div
                                        className={
                                          styles.comboDetail
                                        }
                                      >

                                        <span
                                          className={
                                            styles.comboKicker
                                          }
                                        >
                                          YOUR COMBINATION
                                        </span>


                                        <div
                                          className={
                                            styles.comboTypes
                                          }
                                        >

                                          {
                                            primary.emoji
                                          }
                                          {" "}
                                          {
                                            primary.label
                                          }

                                          <b>
                                            ×
                                          </b>

                                          {
                                            secondary?.emoji
                                          }
                                          {" "}
                                          {
                                            secondary?.label
                                          }

                                        </div>


                                        <h3>
                                          {
                                            meta.combination
                                              .name
                                          }
                                        </h3>


                                        <span
                                          className={
                                            styles.strengthBadge
                                          }
                                        >
                                          {
                                            meta.strength
                                              ?.label
                                          }
                                        </span>


                                        <p
                                          className={
                                            styles.comboTagline
                                          }
                                        >
                                          “{
                                            meta.combination
                                              .tagline
                                          }”
                                        </p>


                                        <p
                                          className={
                                            styles.comboDescription
                                          }
                                        >
                                          {
                                            meta.combination
                                              .description
                                          }
                                        </p>

                                      </div>

                                    )}


                                    {/* 점수 */}

                                    <div
                                      className={
                                        styles.scoreGrid
                                      }
                                    >

                                      {Object.entries(
                                        TYPE_INFO
                                      ).map(
                                        ([
                                          type,
                                          info,
                                        ]) => (

                                          <div
                                            key={
                                              type
                                            }
                                            className={
                                              styles.scoreBox
                                            }
                                          >

                                            <span>
                                              {
                                                info.emoji
                                              }
                                              {" "}
                                              {
                                                info.label
                                              }
                                            </span>

                                            <strong>
                                              {
                                                scores[
                                                  type
                                                ] ??
                                                0
                                              }
                                              점
                                            </strong>

                                          </div>

                                        )
                                      )}

                                    </div>

                                  </section>

                                )}


                                {/* ===================================
                                    문항 응답
                                =================================== */}

                                <section
                                  className={
                                    styles.detailBlock
                                  }
                                >

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
                                      styles.answersList
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

                                        const questionNumber =
                                          index +
                                          1;


                                        const answer =
                                          getAnswerEntry(
                                            item.answers,
                                            questionNumber
                                          );


                                        const storedQuestion =
                                          (
                                            answer &&
                                            typeof answer ===
                                              "object"
                                          )
                                            ? answer.question
                                            : null;


                                        return (

                                          <article
                                            key={
                                              questionNumber
                                            }
                                            className={
                                              answer
                                                ? styles.answerCard
                                                : styles.answerCardEmpty
                                            }
                                          >

                                            <div
                                              className={
                                                styles.answerNumber
                                              }
                                            >
                                              Q
                                              {
                                                String(
                                                  questionNumber
                                                ).padStart(
                                                  2,
                                                  "0"
                                                )
                                              }
                                            </div>


                                            <div
                                              className={
                                                styles.answerContent
                                              }
                                            >

                                              <h4>

                                                {
                                                  storedQuestion ||
                                                  (
                                                    meta.version
                                                      .isNew
                                                      ? QUESTIONS[
                                                          index
                                                        ]?.question
                                                      : "이전 버전에서 사용하지 않은 문항"
                                                  )
                                                }

                                              </h4>


                                              {answer ? (
                                                <>

                                                  <p>
                                                    {
                                                      getAnswerText(
                                                        answer
                                                      )
                                                    }
                                                  </p>


                                                  {getAnswerTypeLabel(
                                                    answer
                                                  ) && (

                                                    <span
                                                      className={
                                                        styles.answerType
                                                      }
                                                    >
                                                      {
                                                        getAnswerTypeLabel(
                                                          answer
                                                        )
                                                      }

                                                      {
                                                        typeof answer ===
                                                          "object" &&
                                                        answer.score !==
                                                          undefined
                                                          ? ` · ${answer.score}점`
                                                          : ""
                                                      }

                                                    </span>

                                                  )}

                                                </>
                                              ) : (

                                                <p
                                                  className={
                                                    styles.noAnswer
                                                  }
                                                >
                                                  응답 없음
                                                </p>

                                              )}

                                            </div>

                                          </article>

                                        );
                                      }
                                    )}


                                    {item.answers
                                      ?.tiebreaker && (

                                      <article
                                        className={`${styles.answerCard} ${styles.tieAnswerCard}`}
                                      >

                                        <div
                                          className={
                                            styles.answerNumber
                                          }
                                        >
                                          FINAL
                                        </div>


                                        <div
                                          className={
                                            styles.answerContent
                                          }
                                        >

                                          <h4>
                                            {
                                              item.answers
                                                .tiebreaker
                                                .question
                                            }
                                          </h4>

                                          <p>
                                            {
                                              item.answers
                                                .tiebreaker
                                                .answer
                                            }
                                          </p>

                                          <span
                                            className={
                                              styles.answerType
                                            }
                                          >
                                            {
                                              item.answers
                                                .tiebreaker
                                                .typeLabel
                                            }
                                          </span>

                                        </div>

                                      </article>

                                    )}

                                  </div>

                                </section>

                              </div>

                            </td>

                          </tr>

                        )}

                      </>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>


        <footer
          className={
            styles.footer
          }
        >
          OSSTEM IMPLANT · OPENING PROFILE ADMIN
        </footer>

      </div>

    </main>
  );
}
