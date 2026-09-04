import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setAdminCookie, clearAdminCookie } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true, passwordHash: true },
  });
  if (!cookbook) {
    return NextResponse.json({ error: "Cookbook not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const password = typeof (body as Record<string, unknown>).password === "string"
    ? (body as Record<string, unknown>).password as string
    : "";

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const valid = await verifyPassword(password, cookbook.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await setAdminCookie(cookbookId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
