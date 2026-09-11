import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember, requireCookbookOwner } from "@/lib/auth";
import { photoClientPayload } from "@/lib/cook-photos";

const RECIPE_NAME_MAX = 200;
const INGREDIENTS_MAX = 8000;
const INSTRUCTIONS_MAX = 15000;

function sanitize(str: string, max: number): string {
  return str.slice(0, max).trim();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id: cookbookId, recipeId } = await params;
  const auth = await requireCookbookMember(cookbookId);
  if ("error" in auth) return auth.error;

  const isOwner = auth.role === "owner";

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
    select: {
      id: true,
      name: true,
      submitterName: true,
      ingredients: true,
      instructions: true,
      lastEditedBy: true,
      createdAt: true,
      updatedAt: true,
      editToken: true,
      notes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          authorName: true,
          body: true,
          createdAt: true,
        },
      },
      cooks: {
        orderBy: { cookedAt: "desc" },
        select: {
          id: true,
          userId: true,
          cookName: true,
          rating: true,
          cookedAt: true,
          photos: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              url: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  const timesCooked = recipe.cooks.length;
  const lastCookedAt = recipe.cooks[0]?.cookedAt ?? null;
  const cookedBy = Array.from(new Set(recipe.cooks.map((c) => c.cookName)));
  const ratingSum = recipe.cooks.reduce((sum, c) => sum + c.rating, 0);
  const averageRating =
    timesCooked > 0 ? Math.round((ratingSum / timesCooked) * 10) / 10 : null;
  const canEdit = isOwner || recipe.submitterName === auth.user.username;

  const payload = {
    ...recipe,
    cooks: recipe.cooks.map((c) => ({
      ...c,
      photos: c.photos.map(photoClientPayload),
    })),
    timesCooked,
    lastCookedAt,
    cookedBy,
    averageRating,
    canEdit,
    username: auth.user.username,
    userId: auth.user.userId,
    role: auth.role,
  };

  if (!isOwner) {
    const { editToken: _omit, ...publicRecipe } = payload;
    return NextResponse.json(publicRecipe);
  }
  return NextResponse.json(payload);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id: cookbookId, recipeId } = await params;
  const auth = await requireCookbookMember(cookbookId);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? request.headers.get("x-edit-token") ?? "";

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  const isOwner = auth.role === "owner";
  const isSubmitter = recipe.submitterName === auth.user.username;
  if (!isOwner && !isSubmitter && recipe.editToken !== token) {
    return NextResponse.json(
      { error: "You can only edit recipes you added (or use a valid edit link)." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name =
    typeof (body as Record<string, unknown>).name === "string"
      ? sanitize((body as Record<string, unknown>).name as string, RECIPE_NAME_MAX)
      : undefined;
  const ingredients =
    typeof (body as Record<string, unknown>).ingredients === "string"
      ? sanitize((body as Record<string, unknown>).ingredients as string, INGREDIENTS_MAX)
      : undefined;
  const instructions =
    typeof (body as Record<string, unknown>).instructions === "string"
      ? sanitize((body as Record<string, unknown>).instructions as string, INSTRUCTIONS_MAX)
      : undefined;
  const lastEditedBy = auth.user.username;

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      ...(name !== undefined && { name }),
      ...(ingredients !== undefined && { ingredients }),
      ...(instructions !== undefined && { instructions }),
      lastEditedBy,
    },
    select: {
      id: true,
      name: true,
      submitterName: true,
      ingredients: true,
      instructions: true,
      lastEditedBy: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id: cookbookId, recipeId } = await params;
  const auth = await requireCookbookOwner(cookbookId);
  if ("error" in auth) return auth.error;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id: recipeId } });
  return NextResponse.json({ ok: true });
}
