import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RECIPE_NAME_MAX = 200;
const INGREDIENTS_MAX = 8000;
const INSTRUCTIONS_MAX = 15000;

function sanitize(str: string, max: number): string {
  return str.slice(0, max).trim();
}

function getToken(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get("token") ?? request.headers.get("x-edit-token") ?? "";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Edit token is required." }, { status: 400 });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, editToken: token },
    select: {
      id: true,
      name: true,
      submitterName: true,
      ingredients: true,
      instructions: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!recipe) {
    return NextResponse.json(
      { error: "Recipe not found or invalid edit link." },
      { status: 403 }
    );
  }

  return NextResponse.json(recipe);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Edit token is required." }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  if (recipe.editToken !== token) {
    return NextResponse.json(
      { error: "Invalid edit link. Only the person with the edit link can edit it." },
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
