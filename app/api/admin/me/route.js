import { NextResponse } from "next/server";

import {
  requireAdmin,
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

  return NextResponse.json(
    {
      success: true,
      email:
        auth.user.email,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}
