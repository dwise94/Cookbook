import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember } from "@/lib/auth";

const BODY_MAX = 2000;

function sanitize(str: string, max: number): string {
  return str.slice(0, max).trim();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  const { id: cookbookId, recipeId } = await params;
  const auth = await requireCookbookMember(cookbookId);
  if ("error" in auth) return auth.error;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, cookbookId },
    select: { id: true },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const noteBody =
    typeof (body as Record<string, unknown>).body === "string"
      ? sanitize((body as Record<string, unknown>).body as string, BODY_MAX)
      : "";

  if (!noteBody) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }

  const note = await prisma.recipeNote.create({
    data: {
      recipeId,
      userId: auth.user.userId,
      authorName: auth.user.username,
      body: noteBody,
    },
    select: {
      id: true,
      authorName: true,
      body: true,
      createdAt: true,
    },
  });

  return NextResponse.json(note);
}
