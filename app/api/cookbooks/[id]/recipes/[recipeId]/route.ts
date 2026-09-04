import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminCookbookId } from "@/lib/auth";

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
  const adminId = await getAdminCookbookId();
  const isAdmin = adminId === cookbookId;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
    select: {
      id: true,
      name: true,
      submitterName: true,
      ingredients: true,
      instructions: true,
      createdAt: true,
      updatedAt: true,
      editToken: true,
    },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  if (!isAdmin) {
    const { editToken: _omit, ...publicRecipe } = recipe;
    return NextResponse.json(publicRecipe);
  }
  return NextResponse.json(recipe);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id: cookbookId, recipeId } = await params;
  const adminId = await getAdminCookbookId();
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? request.headers.get("x-edit-token") ?? "";

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  const isAdmin = adminId === cookbookId;
  if (!isAdmin && recipe.editToken !== token) {
    return NextResponse.json(
      { error: "You must be the admin or have a valid edit link." },
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

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      ...(name !== undefined && { name }),
      ...(ingredients !== undefined && { ingredients }),
      ...(instructions !== undefined && { instructions }),
    },
    select: {
      id: true,
      name: true,
      submitterName: true,
      ingredients: true,
      instructions: true,
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
  const adminCookbookId = await getAdminCookbookId();
  if (adminCookbookId !== cookbookId) {
    return NextResponse.json(
      { error: "You must be the cookbook admin to delete recipes." },
      { status: 403 }
    );
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id: recipeId } });
  return NextResponse.json({ ok: true });
}
