import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminCookbookId, getCreatorPayload } from "@/lib/auth";

const NAME_MAX = 100;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookbook = await prisma.cookbook.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      creatorName: true,
      contributeToken: true,
      _count: { select: { recipes: true } },
    },
  });
  if (!cookbook) {
    return NextResponse.json({ error: "Cookbook not found." }, { status: 404 });
  }

  const adminId = await getAdminCookbookId();
  const creator = await getCreatorPayload();
  const isOwner =
    adminId === id || (creator !== null && creator.cookbookIds.includes(id));

  return NextResponse.json({
    id: cookbook.id,
    name: cookbook.name,
    creatorName: cookbook.creatorName,
    recipeCount: cookbook._count.recipes,
    ...(isOwner ? { contributeToken: cookbook.contributeToken, canSubmit: true } : {}),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminCookbookId = await getAdminCookbookId();
  if (adminCookbookId !== id) {
    return NextResponse.json(
      { error: "You must be the cookbook admin to change the name." },
      { status: 403 }
    );
  }

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
