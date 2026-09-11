import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember } from "@/lib/auth";
import { deleteBlobPath } from "@/lib/cook-photos";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; recipeId: string; cookId: string; photoId: string }>;
  }
) {
  const { id: cookbookId, recipeId, cookId, photoId } = await params;
  const auth = await requireCookbookMember(cookbookId);
  if ("error" in auth) return auth.error;

  const photo = await prisma.recipeCookPhoto.findFirst({
    where: {
      id: photoId,
      cookId,
      cook: {
        recipeId,
        recipe: { cookbookId },
      },
    },
    select: {
      id: true,
      pathname: true,
      cook: { select: { userId: true } },
    },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const isOwner = auth.role === "owner";
  const isAuthor = photo.cook.userId === auth.user.userId;
  if (!isOwner && !isAuthor) {
    return NextResponse.json(
      { error: "You can only delete photos from your own cook logs." },
      { status: 403 }
    );
  }

  try {
    await deleteBlobPath(photo.pathname);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Blob delete error:", err.message);
  }

  await prisma.recipeCookPhoto.delete({ where: { id: photo.id } });
  return NextResponse.json({ ok: true });
}
