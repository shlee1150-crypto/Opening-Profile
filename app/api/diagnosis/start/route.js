import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";


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
      "Supabase 서버 환경변수가 설정되어 있지 않습니다."
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


export async function POST(
  request
) {
  try {
    const body =
      await request.json();


    const {
      name,
      phone,
      licenseNumber,
      privacyConsent,

      hasSalesManager,
      salesManagerName,
    } = body;


    /* =====================================================
       기본 정보 검증
    ===================================================== */

    const normalizedName =
      String(
        name || ""
      ).trim();


    const normalizedPhone =
      String(
        phone || ""
      ).trim();


    const normalizedLicense =
      String(
        licenseNumber || ""
      ).trim();


    if (!normalizedName) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "이름을 입력해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      normalizedPhone.replace(
        /[^0-9]/g,
        ""
      ).length !==
      11
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "휴대폰 번호를 정확하게 입력해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    if (!normalizedLicense) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "면허번호를 입력해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      privacyConsent !==
      true
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "개인정보 수집 및 이용 동의가 필요합니다.",
        },
        {
          status:
            400,
        }
      );
    }


    /* =====================================================
       영업담당자 검증
    ===================================================== */

    if (
      typeof hasSalesManager !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "영업담당자 유무를 선택해주세요.",
        },
        {
          status:
            400,
        }
      );
    }


    let normalizedSalesManagerName =
      null;


    if (
      hasSalesManager ===
      true
    ) {
      normalizedSalesManagerName =
        String(
          salesManagerName ||
          ""
        ).trim();


      if (
        normalizedSalesManagerName.length <
        2
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "영업담당자 이름을 입력해주세요.",
          },
          {
            status:
              400,
          }
        );
      }


      if (
        normalizedSalesManagerName.length >
        50
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "영업담당자 이름을 확인해주세요.",
          },
          {
            status:
              400,
          }
        );
      }
    }


    /* =====================================================
       Supabase 저장
    ===================================================== */

    const supabase =
      getSupabaseAdmin();


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "diagnosis_responses"
        )
        .insert({
          name:
            normalizedName,

          phone:
            normalizedPhone,

          license_number:
            normalizedLicense,

          privacy_consent:
            true,

          privacy_consent_at:
            new Date()
              .toISOString(),

          has_sales_manager:
            hasSalesManager,

          sales_manager_name:
            normalizedSalesManagerName,

          completed:
            false,
        })
        .select(
          "id"
        )
        .single();


    if (error) {
      console.error(
        "Diagnosis start error:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "진단 정보 저장 중 오류가 발생했습니다.",
        },
        {
          status:
            500,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      responseId:
        data.id,
    });

  } catch (error) {
    console.error(
      "Diagnosis start API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "진단 시작 중 오류가 발생했습니다.",
      },
      {
        status:
          500,
      }
    );
  }
}
