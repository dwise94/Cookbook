import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember, requireCookbookOwner } from "@/lib/auth";

const NAME_MAX = 100;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireCookbookMember(id);
  if ("error" in auth) return auth.error;

  const cookbook = await prisma.cookbook.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      inviteToken: true,
      owner: { select: { username: true } },
      _count: { select: { recipes: true } },
    },
  });
  if (!cookbook) {
    return NextResponse.json({ error: "Cookbook not found." }, { status: 404 });
  }

  const isOwner = auth.role === "owner";

  return NextResponse.json({
    id: cookbook.id,
    name: cookbook.name,
    creatorName: cookbook.owner.username,
    recipeCount: cookbook._count.recipes,
    canSubmit: true,
    role: auth.role,
    username: auth.user.username,
    ...(isOwner ? { inviteToken: cookbook.inviteToken } : {}),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireCookbookOwner(id);
  if ("error" in auth) return auth.error;

  const cookbook = await prisma.cookbook.findUnique({
    where: { id },
    select: { id: true },
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
  const name =
    typeof (body as Record<string, unknown>).name === "string"
      ? ((body as Record<string, unknown>).name as string)
      : "";
  const trimmed = name.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Cookbook name is required." }, { status: 400 });
  }
  if (trimmed.length > NAME_MAX) {
    return NextResponse.json(
      { error: `Cookbook name must be at most ${NAME_MAX} characters.` },
      { status: 400 }
    );
  }

  await prisma.cookbook.update({
    where: { id },
    data: { name: trimmed },
  });
  return NextResponse.json({ ok: true, name: trimmed });
}
