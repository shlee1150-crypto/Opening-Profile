import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;


  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;


  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    throw new Error(
      "Supabase 환경변수가 설정되어 있지 않습니다."
    );
  }


  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );
}


/* =========================================================
   관리자 인증
========================================================= */

async function verifyAdmin(
  request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";


  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization.slice(
          7
        )
      : null;


  if (!token) {
    return {
      success:
        false,

      status:
        401,
    };
  }


  const adminEmail =
    String(
      process.env.ADMIN_EMAIL ||
      ""
    )
      .trim()
      .toLowerCase();


  if (!adminEmail) {
    return {
      success:
        false,

      status:
        500,
    };
  }


  const supabase =
    getSupabaseAdmin();


  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token
    );


  if (
    error ||
    !data?.user
  ) {
    return {
      success:
        false,

      status:
        401,
    };
  }


  const userEmail =
    String(
      data.user.email ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    userEmail !==
    adminEmail
  ) {
    return {
      success:
        false,

      status:
        403,
    };
  }


  return {
    success:
      true,

    supabase,
  };
}


/* =========================================================
   UUID 확인
========================================================= */

function isUuid(
  value
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(
      value ||
      ""
    )
  );
}


/* =========================================================
   GET
========================================================= */

export async function GET(
  request
) {
  try {

    /* =====================================================
       관리자 인증
    ===================================================== */

    const auth =
      await verifyAdmin(
        request
      );


    if (
      !auth.success
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "관리자 권한이 없습니다.",
        },
        {
          status:
            auth.status,
        }
      );
    }


    /* =====================================================
       진단 데이터
    ===================================================== */

    const {
      data:
        responses,

      error:
        responseError,
    } =
      await auth.supabase
        .from(
          "diagnosis_responses"
        )
        .select(`
          id,
          name,
          phone,
          license_number,

          has_sales_manager,
          sales_manager_name,

          privacy_consent,

          answers,
          type_scores,

          result_type,
          result_score,

          secondary_type,
          secondary_score,

          completed,

          created_at,
          completed_at
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (
      responseError
    ) {
      console.error(
        "Diagnosis responses error:",
        responseError
      );


      throw responseError;
    }


    /* =====================================================
       상담 데이터

       category
       = 기존 단일 상담 호환

       categories
       = 새 복수 상담
    ===================================================== */

    const {
      data:
        consultations,

      error:
        consultationError,
    } =
      await auth.supabase
        .from(
          "consultation_requests"
        )
        .select(`
          id,

          diagnosis_response_id,

          category,
          categories,

          needs_manager_matching,

          manager_name,

          status,

          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          5000
        );


    if (
      consultationError
    ) {
      console.error(
        "Consultations error:",
        consultationError
      );


      throw consultationError;
    }


    /* =====================================================
       상담 데이터 MAP
    ===================================================== */

    const consultationMap =
      new Map();


    (
      consultations ||
      []
    ).forEach(
      (consultation) => {

        /*
          새 복수선택 데이터가 있으면
          categories 사용

          기존 데이터는
          category → 배열 형태로 자동 변환
        */

        const normalizedCategories =
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


        consultationMap.set(
          consultation.diagnosis_response_id,
          {
            ...consultation,

            categories:
              normalizedCategories,
          }
        );
      }
    );


    /* =====================================================
       진단 + 상담 합치기
    ===================================================== */

    const items =
      (
        responses ||
        []
      ).map(
        (response) => ({
          ...response,

          consultation:
            consultationMap.get(
              response.id
            ) ||
            null,
        })
      );


    /* =====================================================
       응답
    ===================================================== */

    return NextResponse.json(
      {
        success:
          true,

        items,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "Admin responses API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "관리자 데이터를 불러오지 못했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}


/* =========================================================
   DELETE

   관리자 화면에서 체크한 진단 D/B 삭제

   consultation_requests의 diagnosis_response_id FK가
   ON DELETE CASCADE로 연결되어 있으므로
   diagnosis_responses 삭제 시 연결 상담 데이터도 같이 삭제
========================================================= */

export async function DELETE(
  request
) {
  const deletedIds =
    [];


  try {

    /* =====================================================
       관리자 인증
    ===================================================== */

    const auth =
      await verifyAdmin(
        request
      );


    if (
      !auth.success
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "관리자 권한이 없습니다.",
        },
        {
          status:
            auth.status,
        }
      );
    }


    /* =====================================================
       요청값 확인
    ===================================================== */

    const body =
      await request.json();


    const sourceIds =
      Array.isArray(
        body?.ids
      )
        ? body.ids
        : [];


    const ids =
      [
        ...new Set(
          sourceIds
            .map(
              (id) =>
                String(
                  id ||
                  ""
                ).trim()
            )
            .filter(
              Boolean
            )
        ),
      ];


    if (
      ids.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "삭제할 데이터를 선택해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    /*
      관리자 화면 최대 조회 개수와 동일하게
      5,000개까지만 허용
    */

    if (
      ids.length >
      5000
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "한 번에 삭제할 수 있는 데이터 수를 초과했습니다.",
        },
        {
          status:
            400,
        }
      );
    }


    /*
      임의 문자열이 아니라
      diagnosis_responses의 UUID만 허용
    */

    const invalidIds =
      ids.filter(
        (id) =>
          !isUuid(
            id
          )
      );


    if (
      invalidIds.length >
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "삭제 대상 ID가 올바르지 않습니다.",
        },
        {
          status:
            400,
        }
      );
    }


    /* =====================================================
       삭제

       한 번에 너무 많은 UUID를 넘기지 않도록
       100건씩 나누어서 삭제

       consultation_requests가
       diagnosis_responses와
       ON DELETE CASCADE로 연결되어 있으므로

       진단 D/B 삭제 시 해당 상담 신청 데이터도
       함께 삭제됨
    ===================================================== */

    const batchSize =
      100;


    for (
      let index =
        0;
      index <
        ids.length;
      index +=
        batchSize
    ) {
      const batch =
        ids.slice(
          index,
          index +
            batchSize
        );


      const {
        data:
          deletedRows,

        error:
          deleteError,
      } =
        await auth.supabase
          .from(
            "diagnosis_responses"
          )
          .delete()
          .in(
            "id",
            batch
          )
          .select(
            "id"
          );


      if (
        deleteError
      ) {
        console.error(
          "Admin delete error:",
          deleteError
        );


        return NextResponse.json(
          {
            success:
              false,

            partial:
              deletedIds.length >
              0,

            deletedIds,

            deletedCount:
              deletedIds.length,

            message:
              deletedIds.length >
              0
                ? `${deletedIds.length}건은 삭제되었지만 나머지 데이터 삭제 중 오류가 발생했습니다. 화면을 새로고침한 뒤 다시 확인해주세요.`
                : "선택한 데이터를 삭제하지 못했습니다. 연결 데이터 또는 DB 설정을 확인해주세요.",
          },
          {
            status:
              500,
          }
        );
      }


      (
        deletedRows ||
        []
      ).forEach(
        (row) => {
          if (
            row?.id
          ) {
            deletedIds.push(
              row.id
            );
          }
        }
      );
    }


    if (
      deletedIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          deletedIds:
            [],

          deletedCount:
            0,

          message:
            "삭제할 진단 D/B를 찾을 수 없습니다.",
        },
        {
          status:
            404,
        }
      );
    }


    /* =====================================================
       응답
    ===================================================== */

    return NextResponse.json(
      {
        success:
          true,

        deletedIds,

        deletedCount:
          deletedIds.length,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {
    console.error(
      "Admin responses DELETE API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        partial:
          deletedIds.length >
          0,

        deletedIds,

        deletedCount:
          deletedIds.length,

        message:
          deletedIds.length >
          0
            ? `${deletedIds.length}건은 삭제되었지만 나머지 데이터 삭제 중 오류가 발생했습니다.`
            : "관리자 데이터 삭제 중 오류가 발생했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}
