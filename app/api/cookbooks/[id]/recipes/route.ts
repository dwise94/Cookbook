import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import type { Prisma } from "@prisma/client";

const SUBMITTER_NAME_MAX = 80;
const RECIPE_NAME_MAX = 200;
const INGREDIENTS_MAX = 8000;
const INSTRUCTIONS_MAX = 15000;

function sanitize(str: string, max: number): string {
  return str.slice(0, max).trim();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true },
  });
  if (!cookbook) {
    return NextResponse.json({ error: "Cookbook not found." }, { status: 404 });
  }

  const url = new URL(_request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const where: Prisma.RecipeWhereInput = { cookbookId };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { submitterName: { contains: q } },
      { ingredients: { contains: q } },
      { instructions: { contains: q } },
    ];
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      submitterName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ recipes });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cookbookId } = await params;
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: { id: true, contributeToken: true },
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

  const contributeToken =
    typeof (body as Record<string, unknown>).contributeToken === "string"
      ? ((body as Record<string, unknown>).contributeToken as string)
      : request.headers.get("x-contribute-token") ?? "";

  if (!contributeToken || contributeToken !== cookbook.contributeToken) {
    return NextResponse.json(
      { error: "A valid contribute link is required to add recipes." },
      { status: 403 }
    );
  }

  const submitterName =
    typeof (body as Record<string, unknown>).submitterName === "string"
      ? sanitize((body as Record<string, unknown>).submitterName as string, SUBMITTER_NAME_MAX)
      : "";
  const name =
    typeof (body as Record<string, unknown>).name === "string"
      ? sanitize((body as Record<string, unknown>).name as string, RECIPE_NAME_MAX)
      : "";
  const ingredients =
    typeof (body as Record<string, unknown>).ingredients === "string"
      ? sanitize((body as Record<string, unknown>).ingredients as string, INGREDIENTS_MAX)
      : "";
  const instructions =
    typeof (body as Record<string, unknown>).instructions === "string"
      ? sanitize((body as Record<string, unknown>).instructions as string, INSTRUCTIONS_MAX)
      : "";

  if (!submitterName) {
    return NextResponse.json(
      { error: "Your name is required to add a recipe." },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Recipe name is required." }, { status: 400 });
  }

  const isBlocked = await prisma.blockedSubmitter.findUnique({
    where: {
      cookbookId_submitterName: { cookbookId, submitterName },
    },
  });
  if (isBlocked) {
    return NextResponse.json(
      { error: "You are not allowed to add recipes to this cookbook." },
      { status: 403 }
    );
  }

  const editToken = nanoid(32);
  const recipe = await prisma.recipe.create({
    data: {
      cookbookId,
      name,
      submitterName,
      ingredients,
      instructions,
      editToken,
    },
  });

  return NextResponse.json({
    id: recipe.id,
    editToken,
    message: "Recipe added. Save the edit link below, or ask the admin to send one later.",
  });
}
