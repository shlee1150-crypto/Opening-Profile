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
  getSupabaseBrowser,
} from "./supabaseClient";

import styles from "./admin.module.css";


const TYPE_LABELS = {
  stable:
    "안정정착형",

  aggressive:
    "집중공격형",

  analytical:
    "데이터분석형",

  pioneer:
    "선점개척형",
};


const PAGE_SIZE = 20;


function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(
      value
    ).toLocaleString(
      "ko-KR",
      {
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
      }
    );
  } catch {
    return value;
  }
}


export default function AdminPage() {
  const router =
    useRouter();

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    adminEmail,
    setAdminEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  const [
    selectedRow,
    setSelectedRow,
  ] = useState(null);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    exporting,
    setExporting,
  ] = useState(false);


  /* ========================================
     현재 Access Token
  ======================================== */

  async function getAccessToken() {
    const supabase =
      getSupabaseBrowser();

    const {
      data: {
        session,
      },
    } =
      await supabase.auth.getSession();

    if (!session) {
      throw new Error(
        "LOGIN_REQUIRED"
      );
    }

    return session.access_token;
  }


  /* ========================================
     관리자 데이터 조회
  ======================================== */

  async function loadData(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(
          true
        );
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const accessToken =
        await getAccessToken();


      const meResponse =
        await fetch(
          "/api/admin/me",
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            cache:
              "no-store",
          }
        );

      const me =
        await meResponse.json();

      if (
        !meResponse.ok ||
        !me.success
      ) {
        throw new Error(
          meResponse.status ===
            403
            ? "FORBIDDEN"
            : "LOGIN_REQUIRED"
        );
      }

      setAdminEmail(
        me.email || ""
      );


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
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "데이터 조회에 실패했습니다."
        );
      }

      setRows(
        result.rows || []
      );
    } catch (error) {
      if (
        error.message ===
          "LOGIN_REQUIRED" ||
        error.message ===
          "FORBIDDEN"
      ) {
        const supabase =
          getSupabaseBrowser();

        await supabase.auth.signOut();

        router.replace(
          "/admin/login"
        );

        return;
      }

      setErrorMessage(
        error.message ||
          "관리자 데이터를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }


  useEffect(() => {
    loadData();

    const supabase =
      getSupabaseBrowser();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event
        ) => {
          if (
            event ===
            "SIGNED_OUT"
          ) {
            router.replace(
              "/admin/login"
            );
          }
        }
      );

    return () => {
      listener
        .subscription
        .unsubscribe();
    };
  }, []);


  /* ========================================
     검색 + 필터
  ======================================== */

  const filteredRows =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return rows.filter(
        (row) => {
          if (
            statusFilter ===
              "completed" &&
            !row.completed
          ) {
            return false;
          }

          if (
            statusFilter ===
              "incomplete" &&
            row.completed
          ) {
            return false;
          }

          if (
            typeFilter !==
              "all" &&
            row.result_type !==
              typeFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const values = [
            row.name,
            row.phone,
            row.license_number,
            row.result_type,
            row.secondary_type,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return values.includes(
            keyword
          );
        }
      );
    }, [
      rows,
      search,
      statusFilter,
      typeFilter,
    ]);


  /*
    필터가 바뀌면 1페이지
  */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    typeFilter,
  ]);


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRows.length /
          PAGE_SIZE
      )
    );


  const pageRows =
    filteredRows.slice(
      (page - 1) *
        PAGE_SIZE,

      page *
        PAGE_SIZE
    );


  /* ========================================
     통계
  ======================================== */

  const completedCount =
    rows.filter(
      (row) =>
        row.completed
    ).length;

  const incompleteCount =
    rows.length -
    completedCount;


  const typeCounts =
    rows.reduce(
      (
        accumulator,
        row
      ) => {
        if (
          row.result_type
        ) {
          accumulator[
            row.result_type
          ] =
            (
              accumulator[
                row.result_type
              ] || 0
            ) + 1;
        }

        return accumulator;
      },
      {}
    );


  /* ========================================
     로그아웃
  ======================================== */

  async function handleLogout() {
    const supabase =
      getSupabaseBrowser();

    await supabase.auth.signOut();

    router.replace(
      "/admin/login"
    );
  }


  /* ========================================
     CSV 다운로드
  ======================================== */

  async function downloadCsv() {
    try {
      setExporting(true);

      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          "/api/admin/export",
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "CSV 다운로드에 실패했습니다."
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

      link.href = url;

      link.download =
        `opening-profile-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url
      );
    } catch (error) {
      alert(
        error.message
      );
    } finally {
      setExporting(false);
    }
  }


  if (loading) {
    return (
      <main
        className={
          styles.dashboardPage
        }
      >
        <div
          className={
            styles.dashboardLoading
          }
        >
          관리자 데이터를 불러오고 있습니다.
        </div>
      </main>
    );
  }


  return (
    <main
      className={
        styles.dashboardPage
      }
    >
      {/* ==============================
          상단
      ============================== */}

      <header
        className={
          styles.dashboardHeader
        }
      >
        <div>
          <p
            className={
              styles.dashboardEyebrow
            }
          >
            OPENING PROFILE
          </p>

          <h1>
            개원성향진단 관리자
          </h1>

          <p
            className={
              styles.dashboardSub
            }
          >
            {adminEmail}
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
              styles.lightButton
            }

            onClick={() =>
              loadData(true)
            }

            disabled={
              refreshing
            }
          >
            {refreshing
              ? "새로고침 중"
              : "새로고침"}
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


      {/* ==============================
          통계
      ============================== */}

      <section
        className={
          styles.statsGrid
        }
      >
        <div
          className={
            styles.statCard
          }
        >
          <span>
            총 참여자
          </span>

          <strong>
            {rows.length}
          </strong>

          <small>
            명
          </small>
        </div>


        <div
          className={
            styles.statCard
          }
        >
          <span>
            진단 완료
          </span>

          <strong>
            {completedCount}
          </strong>

          <small>
            명
          </small>
        </div>


        <div
          className={
            styles.statCard
          }
        >
          <span>
            미완료
          </span>

          <strong>
            {incompleteCount}
          </strong>

          <small>
            명
          </small>
        </div>


        <div
          className={
            styles.statCard
          }
        >
          <span>
            완료율
          </span>

          <strong>
            {rows.length
              ? Math.round(
                  (
                    completedCount /
                    rows.length
                  ) *
                    100
                )
              : 0}
          </strong>

          <small>
            %
          </small>
        </div>
      </section>


      {/* ==============================
          유형 통계
      ============================== */}

      <section
        className={
          styles.typeSummary
        }
      >
        {[
          "안정정착형",
          "집중공격형",
          "데이터분석형",
          "선점개척형",
        ].map(
          (type) => (
            <div
              key={type}

              className={
                styles.typeSummaryItem
              }
            >
              <span>
                {type}
              </span>

              <strong>
                {typeCounts[
                  type
                ] || 0}
              </strong>
            </div>
          )
        )}
      </section>


      {/* ==============================
          검색
      ============================== */}

      <section
        className={
          styles.toolbar
        }
      >
        <div
          className={
            styles.searchBox
          }
        >
          <input
            type="search"

            placeholder="이름, 휴대폰번호, 면허번호 검색"

            value={search}

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
            statusFilter
          }

          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            전체 상태
          </option>

          <option value="completed">
            완료
          </option>

          <option value="incomplete">
            미완료
          </option>
        </select>


        <select
          value={
            typeFilter
          }

          onChange={(
            event
          ) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            전체 유형
          </option>

          <option value="안정정착형">
            안정정착형
          </option>

          <option value="집중공격형">
            집중공격형
          </option>

          <option value="데이터분석형">
            데이터분석형
          </option>

          <option value="선점개척형">
            선점개척형
          </option>
        </select>


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
            : "CSV 다운로드"}
        </button>
      </section>


      {errorMessage && (
        <div
          className={
            styles.dashboardError
          }
        >
          {errorMessage}
        </div>
      )}


      {/* ==============================
          테이블
      ============================== */}

      <section
        className={
          styles.tableCard
        }
      >
        <div
          className={
            styles.tableMeta
          }
        >
          검색 결과{" "}
          <strong>
            {
              filteredRows.length
            }
          </strong>
          명
        </div>


        <div
          className={
            styles.tableScroll
          }
        >
          <table
            className={
              styles.dataTable
            }
          >
            <thead>
              <tr>
                <th>
                  이름
                </th>

                <th>
                  휴대폰번호
                </th>

                <th>
                  면허번호
                </th>

                <th>
                  상태
                </th>

                <th>
                  최종 유형
                </th>

                <th>
                  보조 유형
                </th>

                <th>
                  참여일
                </th>

                <th />
              </tr>
            </thead>


            <tbody>
              {pageRows.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="8"

                    className={
                      styles.emptyRow
                    }
                  >
                    조건에 맞는 참여자가 없습니다.
                  </td>
                </tr>
              ) : (
                pageRows.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                    >
                      <td
                        className={
                          styles.nameCell
                        }
                      >
                        {row.name ||
                          "-"}
                      </td>

                      <td>
                        {row.phone ||
                          "-"}
                      </td>

                      <td>
                        {row.license_number ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={
                            row.completed
                              ? styles.completedBadge
                              : styles.incompleteBadge
                          }
                        >
                          {row.completed
                            ? "완료"
                            : "미완료"}
                        </span>
                      </td>

                      <td>
                        {row.result_type ||
                          "-"}
                      </td>

                      <td>
                        {row.secondary_type ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          row.created_at
                        )}
                      </td>

                      <td>
                        <button
                          type="button"

                          className={
                            styles.detailButton
                          }

                          onClick={() =>
                            setSelectedRow(
                              row
                            )
                          }
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>


        {/* 페이지 */}

        <div
          className={
            styles.pagination
          }
        >
          <button
            type="button"

            disabled={
              page <= 1
            }

            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.max(
                    1,
                    current -
                      1
                  )
              )
            }
          >
            이전
          </button>


          <span>
            {page} /{" "}
            {totalPages}
          </span>


          <button
            type="button"

            disabled={
              page >=
              totalPages
            }

            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.min(
                    totalPages,
                    current +
                      1
                  )
              )
            }
          >
            다음
          </button>
        </div>
      </section>


      {/* ==============================
          상세보기
      ============================== */}

      {selectedRow && (
        <div
          className={
            styles.modalBackdrop
          }

          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRow(
                null
              );
            }
          }}
        >
          <div
            className={
              styles.modal
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <p>
                  진단 상세
                </p>

                <h2>
                  {selectedRow.name}
                </h2>
              </div>

              <button
                type="button"

                onClick={() =>
                  setSelectedRow(
                    null
                  )
                }
              >
                ×
              </button>
            </div>


            <div
              className={
                styles.detailGrid
              }
            >
              <div>
                <span>
                  휴대폰번호
                </span>

                <strong>
                  {selectedRow.phone ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  면허번호
                </span>

                <strong>
                  {selectedRow.license_number ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  최종 유형
                </span>

                <strong>
                  {selectedRow.result_type ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  최종 점수
                </span>

                <strong>
                  {selectedRow.result_score ??
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  보조 유형
                </span>

                <strong>
                  {selectedRow.secondary_type ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  보조 점수
                </span>

                <strong>
                  {selectedRow.secondary_score ??
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  참여일
                </span>

                <strong>
                  {formatDate(
                    selectedRow.created_at
                  )}
                </strong>
              </div>

              <div>
                <span>
                  완료일
                </span>

                <strong>
                  {formatDate(
                    selectedRow.completed_at
                  )}
                </strong>
              </div>
            </div>


            {/* 유형별 점수 */}

            <div
              className={
                styles.modalSection
              }
            >
              <h3>
                유형별 점수
              </h3>

              <div
                className={
                  styles.scoreDetails
                }
              >
                {Object.entries(
                  TYPE_LABELS
                ).map(
                  ([
                    key,
                    label,
                  ]) => (
                    <div
                      key={
                        key
                      }
                    >
                      <span>
                        {label}
                      </span>

                      <strong>
                        {selectedRow
                          .type_scores?.[
                          key
                        ] ?? 0}
                        점
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>


            {/* 답변 */}

            <div
              className={
                styles.modalSection
              }
            >
              <h3>
                설문 응답
              </h3>

              <div
                className={
                  styles.answerList
                }
              >
                {Object.entries(
                  selectedRow.answers ||
                    {}
                ).map(
                  ([
                    key,
                    answer,
                  ]) => (
                    <div
                      key={
                        key
                      }

                      className={
                        styles.answerItem
                      }
                    >
                      <span
                        className={
                          styles.answerQuestion
                        }
                      >
                        {key ===
                        "tiebreaker"
                          ? "FINAL"
                          : key.toUpperCase()}
                      </span>

                      <div>
                        <strong>
                          {answer.question ||
                            ""}
                        </strong>

                        <p>
                          {answer.answer ||
                            ""}
                        </p>

                        {answer.typeLabel && (
                          <small>
                            {
                              answer.typeLabel
                            }{" "}
                            ·{" "}
                            {
                              answer.score
                            }
                            점
                          </small>
                        )}
                      </div>
                    </div>
                  )
                )}

                {Object.keys(
                  selectedRow.answers ||
                    {}
                ).length ===
                  0 && (
                  <p
                    className={
                      styles.noAnswers
                    }
                  >
                    아직 설문 응답이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
