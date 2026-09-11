import { NextResponse } from "next/server";

/** @deprecated Use /api/auth/login */
export async function POST() {
  return NextResponse.json(
    { error: "Please use the updated login at /login." },
    { status: 410 }
  );
}
