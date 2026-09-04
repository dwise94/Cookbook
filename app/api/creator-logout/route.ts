import { NextResponse } from "next/server";
import { clearCreatorCookie } from "@/lib/auth";

export async function POST() {
  await clearCreatorCookie();
  return NextResponse.json({ ok: true });
}
