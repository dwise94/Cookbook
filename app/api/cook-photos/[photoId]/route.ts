import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember } from "@/lib/auth";
import { fetchPrivateBlob } from "@/lib/cook-photos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;

  const photo = await prisma.recipeCookPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      pathname: true,
      url: true,
      cook: {
        select: {
          recipe: { select: { cookbookId: true } },
        },
      },
    },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const auth = await requireCookbookMember(photo.cook.recipe.cookbookId);
  if ("error" in auth) return auth.error;

  try {
    const result = await fetchPrivateBlob(photo.pathname || photo.url);
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Photo unavailable." }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Cook photo proxy error:", err.message);
    return NextResponse.json({ error: "Could not load photo." }, { status: 500 });
  }
}
