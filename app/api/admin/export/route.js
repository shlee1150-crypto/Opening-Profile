import {
  requireAdmin,
  fetchAllResponses,
} from "../_lib";


function escapeCsv(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    String(value);

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}


function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  try {
    return new Date(
      value
    ).toISOString();
  } catch {
    return value;
  }
}


export async function GET(
  request
) {
  const auth =
    await requireAdmin(
      request
    );

  if (!auth.ok) {
    return new Response(
      auth.message,
      {
        status:
          auth.status,
      }
    );
  }

  try {
    const rows =
      await fetchAllResponses();

    const headers = [
      "이름",
      "휴대폰번호",
      "면허번호",
      "개인정보동의",
      "개인정보동의일시",
      "진단완료",
      "주성향",
      "주성향점수",
      "보조성향",
      "보조성향점수",
      "유형별점수",
      "설문응답",
      "참여일시",
      "완료일시",
      "ID",
    ];

    const lines = [
      headers
        .map(escapeCsv)
        .join(","),
    ];

    for (
      const row
      of rows
    ) {
      const line = [
        row.name,
        row.phone,
        row.license_number,

        row.privacy_consent
          ? "동의"
          : "미동의",

        formatDate(
          row.privacy_consent_at
        ),

        row.completed
          ? "완료"
          : "미완료",

        row.result_type ||
          "",

        row.result_score ??
          "",

        row.secondary_type ||
          "",

        row.secondary_score ??
          "",

        JSON.stringify(
          row.type_scores ||
            {}
        ),

        JSON.stringify(
          row.answers ||
            {}
        ),

        formatDate(
          row.created_at
        ),

        formatDate(
          row.completed_at
        ),

        row.id,
      ];

      lines.push(
        line
          .map(escapeCsv)
          .join(",")
      );
    }

    /*
      Excel 한글 깨짐 방지를 위한 BOM
    */

    const csv =
      "\uFEFF" +
      lines.join("\r\n");

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const filename =
      `opening-profile-${today}.csv`;

    return new Response(
      csv,
      {
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",

          "Content-Disposition":
            `attachment; filename*=UTF-8''${encodeURIComponent(
              filename
            )}`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin export error:",
      error
    );

    return new Response(
      "CSV 파일 생성 중 오류가 발생했습니다.",
      {
        status: 500,
      }
    );
  }
}
