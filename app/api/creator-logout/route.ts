import { NextResponse } from "next/server";
import { clearUserCookie } from "@/lib/auth";

/** @deprecated Use /api/auth/logout */
export async function POST() {
  await clearUserCookie();
  return NextResponse.json({ ok: true });
}
