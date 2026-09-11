import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";

/** Validate invite token (public) or accept invite (logged-in). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true, name: true, inviteToken: true },
  });
  if (!cookbook || !token || cookbook.inviteToken !== token) {
    return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  }

  const user = await getCurrentUser();
  let alreadyMember = false;
  if (user) {
    const membership = await prisma.cookbookMember.findUnique({
      where: { cookbookId_userId: { cookbookId, userId: user.userId } },
    });
    alreadyMember = Boolean(membership);
  }

  return NextResponse.json({
    ok: true,
    cookbookId: cookbook.id,
    name: cookbook.name,
    loggedIn: Boolean(user),
    alreadyMember,
    username: user?.username ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    /* token may come from query */
  }

  const url = new URL(request.url);
  const token =
    (typeof body.token === "string" ? body.token : "") ||
    url.searchParams.get("token") ||
    "";

  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true, inviteToken: true, name: true },
  });
  if (!cookbook || !token || cookbook.inviteToken !== token) {
    return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  }

  await prisma.cookbookMember.upsert({
    where: {
      cookbookId_userId: { cookbookId, userId: auth.user.userId },
    },
    create: {
      cookbookId,
      userId: auth.user.userId,
      role: "member",
    },
    update: {},
  });

  return NextResponse.json({
    ok: true,
    cookbookId: cookbook.id,
    name: cookbook.name,
  });
}
