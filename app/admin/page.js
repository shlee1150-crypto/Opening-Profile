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


const CATEGORY = {
  location: {
    emoji:
      "📍",

    label:
      "입지",
  },

  process: {
    emoji:
      "📋",

    label:
      "프로세스 상담",
  },

  major_equipment: {
    emoji:
      "🦷",

    label:
      "대장비",
  },

  supplies: {
    emoji:
      "🧰",

    label:
      "소장비·기구·재료",
  },
};


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
   상담 상태 정렬 우선순위

   내림차순(desc) 기본:
   신규 → 확인중 → 담당자 배정 → 상담 완료 → 상담 미신청
========================================================= */

const STATUS_SORT_ORDER = {
  new: 4,
  reviewing: 3,
  assigned: 2,
  completed: 1,
};


const LOCATION_SELECTION_STATUS = {
  completed:
    "완료",

  in_progress:
    "진행중",

  planned:
    "추후예정",
};


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
  if (
    !value
  ) {
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
      new Date(
        value
      )
    );

  } catch {
    return "-";
  }
}


/* =========================================================
   문항 개수
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

function getMeta(
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
   상담 카테고리
========================================================= */

function getConsultationCategories(
  consultation
) {
  if (
    !consultation
  ) {
    return [];
  }


  const source =
    Array.isArray(
      consultation.categories
    ) &&
    consultation.categories.length >
      0
      ? consultation.categories
      : consultation.category
        ? [
            consultation.category,
          ]
        : [];


  return [
    ...new Set(
      source.filter(
        (category) =>
          CATEGORY[
            category
          ]
      )
    ),
  ];
}


function consultationLabel(
  consultation
) {
  const categories =
    getConsultationCategories(
      consultation
    );


  if (
    categories.length ===
    0
  ) {
    return "-";
  }


  return categories
    .map(
      (category) =>
        `${CATEGORY[category].emoji} ${CATEGORY[category].label}`
    )
    .join(
      " · "
    );
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


  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState([]);


  const [
    deleting,
    setDeleting,
  ] =
    useState(false);


  /* =======================================================
     테이블 헤더 정렬

     - 기본 정렬: 상담 상태 내림차순
       신규 → 확인중 → 담당자 배정 → 상담 완료 → 미신청
     - 같은 헤더를 다시 누르면 오름차순/내림차순 전환
     - 다른 헤더를 누르면 해당 항목의 기본 방향으로 정렬
  ======================================================= */

  const [
    sortConfig,
    setSortConfig,
  ] =
    useState({
      key: "status",
      direction: "desc",
    });


  const SORT_DEFAULT_DIRECTION = {
    participant: "asc",
    manager: "asc",
    result: "desc",
    combination: "asc",
    consultation: "desc",
    matching: "desc",
    status: "desc",
  };


  function toggleSort(
    key
  ) {
    setSortConfig(
      (previous) => {
        if (
          previous.key ===
          key
        ) {
          return {
            key,
            direction:
              previous.direction ===
              "desc"
                ? "asc"
                : "desc",
          };
        }


        return {
          key,
          direction:
            SORT_DEFAULT_DIRECTION[
              key
            ] ||
            "asc",
        };
      }
    );
  }


  function renderSortHeader(
    label,
    key
  ) {
    const active =
      sortConfig.key ===
      key;


    const indicator =
      active
        ? sortConfig.direction ===
          "desc"
          ? "▼"
          : "▲"
        : "↕";


    const directionLabel =
      active
        ? sortConfig.direction ===
          "desc"
          ? "내림차순"
          : "오름차순"
        : "정렬 가능";


    return (
      <button
        type="button"
        onClick={() =>
          toggleSort(
            key
          )
        }
        title={`${label} · ${directionLabel}`}
        aria-label={`${label} ${directionLabel}. 클릭하여 정렬`}
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          gap:
            "5px",
          padding:
            0,
          border:
            0,
          background:
            "transparent",
          color:
            "inherit",
          font:
            "inherit",
          fontWeight:
            "inherit",
          cursor:
            "pointer",
          whiteSpace:
            "nowrap",
        }}
      >
        {label}

        <span
          aria-hidden="true"
          style={{
            color:
              active
                ? "#f26a21"
                : "#b8b0a8",
            fontSize:
              "12px",
            fontWeight:
              "900",
          }}
        >
          {indicator}
        </span>
      </button>
    );
  }


  /* =======================================================
     TOKEN
  ======================================================= */

  async function getAccessToken() {
    if (
      !supabase
    ) {
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


      if (
        !supabase
      ) {
        throw new Error(
          "Supabase 연결 정보를 확인해주세요."
        );
      }


      const accessToken =
        await getAccessToken();


      if (
        !accessToken
      ) {
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
        "Admin load error:",
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


  useEffect(
    () => {
      setSelectedIds(
        []
      );
    },
    [
      search,
      consultationFilter,
      managerFilter,
    ]
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
      [
        rows,
      ]
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
          (
            a,
            b
          ) =>
            a.localeCompare(
              b,
              "ko"
            )
        );
      },
      [
        enriched,
      ]
    );


  /* =======================================================
     통계
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
      [
        enriched,
      ]
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


        const filteredItems =
          enriched.filter(
          (item) => {
            const categories =
              getConsultationCategories(
                item.consultation
              );


            if (
              keyword
            ) {
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

                  item.consultation
                    ?.desired_region,

                  item.consultation
                    ?.planned_opening_year,

                  item.consultation
                    ?.planned_opening_month,

                  LOCATION_SELECTION_STATUS[
                    item.consultation
                      ?.location_selection_status
                  ],

                  item.consultation
                    ?.memo,

                  ...categories.map(
                    (category) =>
                      CATEGORY[
                        category
                      ]?.label
                  ),
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " "
                  )
                  .toLowerCase();


              if (
                !searchable.includes(
                  keyword
                )
              ) {
                return false;
              }
            }


            /* 상담 신청 */

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


            /* 영업담당자 매칭 필요 */

            if (
              consultationFilter ===
                "matching" &&
              item.consultation
                ?.needs_manager_matching !==
                true
            ) {
              return false;
            }


            /* 상담종류 */

            if (
              [
                "location",
                "process",
                "major_equipment",
                "supplies",
              ].includes(
                consultationFilter
              ) &&
              !categories.includes(
                consultationFilter
              )
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


        return filteredItems.sort(
          (a, b) => {
            const direction =
              sortConfig.direction ===
              "desc"
                ? -1
                : 1;


            const compareText =
              (aValue, bValue) =>
                String(
                  aValue ||
                  ""
                ).localeCompare(
                  String(
                    bValue ||
                    ""
                  ),
                  "ko"
                );


            const compareNullableText =
              (aValue, bValue) => {
                const aEmpty =
                  !String(
                    aValue ||
                    ""
                  ).trim();


                const bEmpty =
                  !String(
                    bValue ||
                    ""
                  ).trim();


                /* 값이 없는 항목은 정렬 방향과 관계없이 아래쪽 */

                if (
                  aEmpty &&
                  !bEmpty
                ) {
                  return 1;
                }


                if (
                  !aEmpty &&
                  bEmpty
                ) {
                  return -1;
                }


                if (
                  aEmpty &&
                  bEmpty
                ) {
                  return 0;
                }


                return (
                  compareText(
                    aValue,
                    bValue
                  ) *
                  direction
                );
              };


            let primaryCompare =
              0;


            if (
              sortConfig.key ===
              "participant"
            ) {
              primaryCompare =
                compareNullableText(
                  a.name,
                  b.name
                );


              if (
                primaryCompare ===
                0
              ) {
                primaryCompare =
                  compareNullableText(
                    a.phone,
                    b.phone
                  );
              }
            }


            if (
              sortConfig.key ===
              "manager"
            ) {
              const aManager =
                a.has_sales_manager ===
                  true
                  ? a.sales_manager_name
                  : "";


              const bManager =
                b.has_sales_manager ===
                  true
                  ? b.sales_manager_name
                  : "";


              primaryCompare =
                compareNullableText(
                  aManager,
                  bManager
                );
            }


            if (
              sortConfig.key ===
              "result"
            ) {
              const aScore =
                typeof a.result_score ===
                "number"
                  ? a.result_score
                  : null;


              const bScore =
                typeof b.result_score ===
                "number"
                  ? b.result_score
                  : null;


              if (
                aScore ===
                  null &&
                bScore !==
                  null
              ) {
                primaryCompare =
                  1;
              } else if (
                aScore !==
                  null &&
                bScore ===
                  null
              ) {
                primaryCompare =
                  -1;
              } else if (
                aScore !==
                  null &&
                bScore !==
                  null &&
                aScore !==
                  bScore
              ) {
                primaryCompare =
                  (aScore -
                    bScore) *
                  direction;
              } else {
                primaryCompare =
                  compareNullableText(
                    a.result_type,
                    b.result_type
                  );
              }
            }


            if (
              sortConfig.key ===
              "combination"
            ) {
              primaryCompare =
                compareNullableText(
                  a.meta
                    .combination
                    ?.name,
                  b.meta
                    .combination
                    ?.name
                );
            }


            if (
              sortConfig.key ===
              "consultation"
            ) {
              const aRank =
                a.consultation
                  ? 1
                  : 0;


              const bRank =
                b.consultation
                  ? 1
                  : 0;


              primaryCompare =
                (aRank -
                  bRank) *
                direction;


              if (
                primaryCompare ===
                  0 &&
                aRank ===
                  1
              ) {
                primaryCompare =
                  compareText(
                    consultationLabel(
                      a.consultation
                    ),
                    consultationLabel(
                      b.consultation
                    )
                  ) *
                  direction;
              }
            }


            if (
              sortConfig.key ===
              "matching"
            ) {
              const getMatchingRank =
                (item) => {
                  if (
                    !item.consultation
                  ) {
                    return -1;
                  }


                  const categories =
                    getConsultationCategories(
                      item.consultation
                    );


                  const hasNonLocation =
                    categories.some(
                      (category) =>
                        category !==
                        "location"
                    );


                  if (
                    !hasNonLocation
                  ) {
                    return 0;
                  }


                  if (
                    item.consultation
                      .needs_manager_matching ===
                    true
                  ) {
                    return 3;
                  }


                  if (
                    item.has_sales_manager ===
                    true
                  ) {
                    return 2;
                  }


                  return 1;
                };


              primaryCompare =
                (
                  getMatchingRank(
                    a
                  ) -
                  getMatchingRank(
                    b
                  )
                ) *
                direction;
            }


            if (
              sortConfig.key ===
              "status"
            ) {
              const aRank =
                STATUS_SORT_ORDER[
                  a.consultation
                    ?.status
                ] ?? 0;


              const bRank =
                STATUS_SORT_ORDER[
                  b.consultation
                    ?.status
                ] ?? 0;


              primaryCompare =
                (aRank -
                  bRank) *
                direction;
            }


            if (
              primaryCompare !==
              0
            ) {
              return primaryCompare;
            }


            /* 같은 정렬값 안에서는 최근 상담/등록 순 */

            const aDate =
              new Date(
                a.consultation
                  ?.updated_at ||
                a.consultation
                  ?.created_at ||
                a.created_at ||
                0
              ).getTime();


            const bDate =
              new Date(
                b.consultation
                  ?.updated_at ||
                b.consultation
                  ?.created_at ||
                b.created_at ||
                0
              ).getTime();


            return bDate -
              aDate;
          }
        );
      },
      [
        enriched,
        search,
        consultationFilter,
        managerFilter,
        sortConfig,
      ]
    );


  /* =======================================================
     선택 / 삭제
  ======================================================= */

  const selectedIdSet =
    useMemo(
      () =>
        new Set(
          selectedIds
        ),
      [
        selectedIds,
      ]
    );


  const allFilteredSelected =
    filtered.length >
      0 &&
    filtered.every(
      (item) =>
        selectedIdSet.has(
          item.id
        )
    );


  function toggleRowSelection(
    id
  ) {
    if (
      deleting
    ) {
      return;
    }


    setSelectedIds(
      (previous) =>
        previous.includes(
          id
        )
          ? previous.filter(
              (selectedId) =>
                selectedId !==
                id
            )
          : [
              ...previous,
              id,
            ]
    );
  }


  function toggleSelectAllVisible() {
    if (
      deleting ||
      filtered.length ===
        0
    ) {
      return;
    }


    const visibleIds =
      filtered.map(
        (item) =>
          item.id
      );


    if (
      allFilteredSelected
    ) {
      const visibleIdSet =
        new Set(
          visibleIds
        );


      setSelectedIds(
        (previous) =>
          previous.filter(
            (id) =>
              !visibleIdSet.has(
                id
              )
          )
      );


      return;
    }


    setSelectedIds(
      (previous) => [
        ...new Set([
          ...previous,
          ...visibleIds,
        ]),
      ]
    );
  }


  async function deleteSelectedRows() {
    if (
      deleting ||
      selectedIds.length ===
        0
    ) {
      return;
    }


    const count =
      selectedIds.length;


    const confirmed =
      window.confirm(
        `선택한 ${count}건을 삭제하시겠습니까?\n\n삭제하면 진단 결과와 연결된 상담 신청 데이터도 함께 삭제되며 복구할 수 없습니다.`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setDeleting(
        true
      );


      const accessToken =
        await getAccessToken();


      if (
        !accessToken
      ) {
        router.replace(
          "/admin/login"
        );


        return;
      }


      const response =
        await fetch(
          "/api/admin/responses",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                ids:
                  selectedIds,
              }),
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
        const partiallyDeletedIds =
          Array.isArray(
            result.deletedIds
          )
            ? result.deletedIds
            : [];


        if (
          partiallyDeletedIds.length >
          0
        ) {
          const deletedSet =
            new Set(
              partiallyDeletedIds
            );


          setRows(
            (previous) =>
              previous.filter(
                (row) =>
                  !deletedSet.has(
                    row.id
                  )
              )
          );


          setSelectedIds(
            (previous) =>
              previous.filter(
                (id) =>
                  !deletedSet.has(
                    id
                  )
              )
          );
        }


        throw new Error(
          result.message ||
          "선택한 데이터를 삭제하지 못했습니다."
        );
      }


      const deletedIds =
        Array.isArray(
          result.deletedIds
        )
          ? result.deletedIds
          : selectedIds;


      const deletedSet =
        new Set(
          deletedIds
        );


      setRows(
        (previous) =>
          previous.filter(
            (row) =>
              !deletedSet.has(
                row.id
              )
          )
      );


      if (
        expanded &&
        deletedSet.has(
          expanded
        )
      ) {
        setExpanded(
          null
        );
      }


      setSelectedIds(
        []
      );


      alert(
        `${result.deletedCount ?? deletedIds.length}건을 삭제했습니다.`
      );

    } catch (error) {
      alert(
        error.message ||
        "데이터 삭제 중 오류가 발생했습니다."
      );

    } finally {
      setDeleting(
        false
      );
    }
  }


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


      if (
        !accessToken
      ) {
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


      if (
        !accessToken
      ) {
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


      if (
        !response.ok
      ) {
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
    if (
      supabase
    ) {
      await supabase.auth
        .signOut();
    }


    router.replace(
      "/admin/login"
    );
  }


  if (
    loading
  ) {
    return (
      <main className={styles.loading}>
        관리자 데이터를
        불러오고 있습니다.
      </main>
    );
  }


  return (
    <main className={styles.page}>

      <div className={styles.container}>


        {/* HEADER */}

        <header className={styles.header}>

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


          <div className={styles.headerButtons}>

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

          <div className={styles.errorBox}>
            {errorMessage}
          </div>

        )}


        {/* 통계 */}

        <section className={styles.stats}>

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
              영업담당자 매칭 필요
            </span>

            <strong>
              {stats.matching}
            </strong>

            <small>
              건
            </small>

          </article>

        </section>


        {/* FILTER */}

        <section className={styles.filters}>

          <div className={styles.searchBox}>

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
              🔥 영업담당자 매칭 필요
            </option>


            <option value="location">
              📍 입지
            </option>


            <option value="process">
              📋 프로세스 상담
            </option>


            <option value="major_equipment">
              🦷 대장비
            </option>


            <option value="supplies">
              🧰 소장비·기구·재료
            </option>

          </select>

        </section>


        {/* 빠른 필터 */}

        <div className={styles.quickFilterRow}>

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


            영업담당자 매칭 필요


            <strong>
              {stats.matching}건
            </strong>

          </button>

        </div>


        {/* LIST HEADER */}

        <div className={styles.listHeader}>

          <div>

            <span>
              RESPONSE DATA
            </span>


            <h2>
              진단 참여자
            </h2>

          </div>


          <div className={styles.listHeaderActions}>

            <strong className={styles.recordCount}>
              {filtered.length}건
            </strong>


            {selectedIds.length >
              0 && (

              <span className={styles.selectedCount}>
                {selectedIds.length}건 선택됨
              </span>

            )}


            <button
              type="button"

              className={styles.deleteButton}

              disabled={
                selectedIds.length ===
                  0 ||
                deleting
              }

              onClick={
                deleteSelectedRows
              }
            >
              {deleting
                ? "삭제 중..."
                : "🗑 선택 삭제"}
            </button>

          </div>

        </div>


        {/* TABLE */}

        <div className={styles.tableWrap}>

          <table>

            <thead>

              <tr>

                <th className={styles.checkboxColumn}>

                  <input
                    type="checkbox"

                    className={styles.rowCheckbox}

                    aria-label="현재 목록 전체 선택"

                    checked={
                      allFilteredSelected
                    }

                    disabled={
                      filtered.length ===
                        0 ||
                      deleting
                    }

                    onChange={
                      toggleSelectAllVisible
                    }
                  />

                </th>

                <th>
                  {renderSortHeader(
                    "참여자",
                    "participant"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "영업담당자",
                    "manager"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "진단결과",
                    "result"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "복합성향",
                    "combination"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "상담",
                    "consultation"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "영업담당자 매칭",
                    "matching"
                  )}
                </th>

                <th>
                  {renderSortHeader(
                    "상담 상태",
                    "status"
                  )}
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
                      9
                    }
                  >

                    <div className={styles.empty}>

                      <span>
                        🔎
                      </span>


                      <strong>
                        조건에 맞는 데이터가 없습니다.
                      </strong>


                      <p>
                        검색어 또는 필터를 변경해주세요.
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


                    const categories =
                      getConsultationCategories(
                        consultation
                      );


                    const hasNonLocation =
                      categories.some(
                        (category) =>
                          category !==
                          "location"
                      );


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
                          className={[
                            isMatchingNeeded
                              ? styles.matchingRow
                              : "",

                            selectedIdSet.has(
                              item.id
                            )
                              ? styles.selectedRow
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )}
                        >

                          {/* 선택 */}

                          <td className={styles.checkboxCell}>

                            <input
                              type="checkbox"

                              className={styles.rowCheckbox}

                              aria-label={`${item.name || "참여자"} 선택`}

                              checked={
                                selectedIdSet.has(
                                  item.id
                                )
                              }

                              disabled={
                                deleting
                              }

                              onChange={() =>
                                toggleRowSelection(
                                  item.id
                                )
                              }
                            />

                          </td>


                          {/* 참여자 */}

                          <td>

                            <strong>
                              {item.name ||
                                "-"}
                            </strong>


                            <small>
                              {item.phone ||
                                "-"}
                            </small>

                          </td>


                          {/* 기존 영업담당자 */}

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


                          {/* 진단 결과 */}

                          <td>

                            {primary ? (

                              <div className={styles.profileCell}>

                                <strong>
                                  {primary.emoji}{" "}
                                  {primary.label}
                                </strong>


                                <small>
                                  {item.result_score ??
                                    "-"}점
                                </small>

                              </div>

                            ) : (
                              "-"
                            )}

                          </td>


                          {/* 복합성향 */}

                          <td>

                            <strong className={styles.combo}>
                              {item.meta
                                .combination
                                ?.name ||
                                "-"}
                            </strong>

                          </td>


                          {/* 희망 상담 */}

                          <td>
                            {consultationLabel(
                              consultation
                            )}
                          </td>


                          {/* 영업담당자 매칭 */}

                          <td>

                            {!consultation ? (
                              "-"
                            ) : !hasNonLocation ? (

                              <span className={styles.notApplicableBadge}>
                                해당없음
                              </span>

                            ) : item.has_sales_manager ===
                              true ? (

                              <span className={styles.noMatchingBadge}>
                                기존 담당자
                              </span>

                            ) : isMatchingNeeded ? (

                              <span className={styles.matchingBadge}>
                                영업담당자 매칭 필요
                              </span>

                            ) : (

                              <span className={styles.noMatchingBadge}>
                                매칭 불필요
                              </span>

                            )}

                          </td>


                          {/* 상태 */}

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


                          {/* 상세 */}

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


                        {/* 상세 */}

                        {expanded ===
                          item.id && (

                          <tr>

                            <td
                              colSpan={
                                9
                              }

                              className={
                                styles.expanded
                              }
                            >

                              <div className={styles.detailPanel}>


                                {/* 참여자 정보 */}

                                <section>

                                  <div className={styles.detailTitle}>

                                    <span>
                                      PARTICIPANT
                                    </span>


                                    <h3>
                                      참여자 정보
                                    </h3>

                                  </div>


                                  <div className={styles.infoGrid}>

                                    <div>

                                      <span>
                                        이름
                                      </span>

                                      <strong>
                                        {item.name ||
                                          "-"}
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        휴대폰
                                      </span>

                                      <strong>
                                        {item.phone ||
                                          "-"}
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        면허번호
                                      </span>

                                      <strong>
                                        {item.license_number ||
                                          "-"}
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

                                    <div className={styles.detailTitle}>

                                      <span>
                                        DIAGNOSIS
                                      </span>

                                      <h3>
                                        진단 결과
                                      </h3>

                                    </div>


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
                                          {item.result_score ??
                                            "-"}점
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


                                {/* 상담내역 */}

                                {consultation && (

                                  <section
                                    className={
                                      isMatchingNeeded
                                        ? styles.matchingConsultationDetail
                                        : styles.consultationDetail
                                    }
                                  >

                                    <div className={styles.detailTitle}>

                                      <span>
                                        CONSULTATION
                                      </span>

                                      <h3>
                                        상담 신청 내역
                                      </h3>

                                    </div>


                                    {isMatchingNeeded && (

                                      <div className={styles.matchingAlert}>
                                        🔥 영업담당자 매칭이 필요한 상담입니다.
                                      </div>

                                    )}


                                    <div className={styles.infoGrid}>

                                      <div>

                                        <span>
                                          희망 상담
                                        </span>

                                        <strong>
                                          {consultationLabel(
                                            consultation
                                          )}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          개원 희망 지역
                                        </span>

                                        <strong>
                                          {consultation.desired_region ||
                                            "-"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          개원 예정시기
                                        </span>

                                        <strong>
                                          {consultation.planned_opening_year &&
                                          consultation.planned_opening_month
                                            ? `${consultation.planned_opening_year}년 ${consultation.planned_opening_month}월`
                                            : "-"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          입지선정
                                        </span>

                                        <strong>
                                          {LOCATION_SELECTION_STATUS[
                                            consultation.location_selection_status
                                          ] || "-"}
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
                                          영업담당자 매칭
                                        </span>

                                        <strong>
                                          {!hasNonLocation
                                            ? "해당없음"
                                            : item.has_sales_manager
                                              ? "기존 담당자 있음"
                                              : isMatchingNeeded
                                                ? "필요"
                                                : "불필요"}
                                        </strong>

                                      </div>


                                      <div>

                                        <span>
                                          상담에서 입력한 영업담당자
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


                                      <div>

                                        <span>
                                          메모
                                        </span>

                                        <strong>
                                          {consultation.memo ||
                                            "-"}
                                        </strong>

                                      </div>

                                    </div>

                                  </section>

                                )}


                                {/* 문항별 응답 */}

                                <section>

                                  <div className={styles.detailTitle}>

                                    <span>
                                      ANSWERS
                                    </span>

                                    <h3>
                                      문항별 응답
                                    </h3>

                                  </div>


                                  <div className={styles.answers}>

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
