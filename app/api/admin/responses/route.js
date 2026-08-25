import { NextResponse } from "next/server";

import {
  requireAdmin,
  fetchAllResponses,
} from "../_lib";


export async function GET(
  request
) {
  const auth =
    await requireAdmin(
      request
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          auth.message,
      },
      {
        status:
          auth.status,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  try {
    const rows =
      await fetchAllResponses();

    return NextResponse.json(
      {
        success: true,
        rows,
        total:
          rows.length,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin responses error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "참여자 정보를 불러오지 못했습니다.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
