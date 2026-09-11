import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCookbookMember } from "@/lib/auth";
import {
  blobConfigured,
  collectPhotoFiles,
  MAX_PHOTOS_PER_COOK,
  photoClientPayload,
  uploadCookPhotos,
  validatePhotoFiles,
} from "@/lib/cook-photos";

export const runtime = "nodejs";
export const maxDuration = 60;

const photoSelect = {
  id: true,
  url: true,
  createdAt: true,
} as const;

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; recipeId: string; cookId: string }> }
) {
  const { id: cookbookId, recipeId, cookId } = await params;
  const auth = await requireCookbookMember(cookbookId);
  if ("error" in auth) return auth.error;

  const cook = await prisma.recipeCook.findFirst({
    where: {
      id: cookId,
      recipeId,
      recipe: { cookbookId },
    },
    select: {
      id: true,
      userId: true,
      _count: { select: { photos: true } },
    },
  });
  if (!cook) {
    return NextResponse.json({ error: "Cook log not found." }, { status: 404 });
  }

  const isOwner = auth.role === "owner";
  const isAuthor = cook.userId === auth.user.userId;
  if (!isOwner && !isAuthor) {
    return NextResponse.json(
      { error: "You can only add photos to your own cook logs." },
      { status: 403 }
    );
  }

  if (!blobConfigured()) {
    return NextResponse.json(
      { error: "Photo uploads are not configured yet. Add BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const photoFiles = collectPhotoFiles(formData);
  if (photoFiles.length === 0) {
    return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });
  }

  const remaining = MAX_PHOTOS_PER_COOK - cook._count.photos;
  if (remaining <= 0) {
    return NextResponse.json(
      { error: `This cook already has the maximum of ${MAX_PHOTOS_PER_COOK} photos.` },
      { status: 400 }
    );
  }
  if (photoFiles.length > remaining) {
    return NextResponse.json(
      { error: `You can add at most ${remaining} more photo${remaining === 1 ? "" : "s"}.` },
      { status: 400 }
    );
  }

  const invalid = validatePhotoFiles(photoFiles);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  let uploaded: { url: string; pathname: string }[] = [];
  try {
    uploaded = await uploadCookPhotos(cookbookId, recipeId, photoFiles);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Add cook photo error:", err.message, err);
    return NextResponse.json(
      { error: "Could not upload photos.", details: err.message },
      { status: 500 }
    );
  }

  await prisma.recipeCookPhoto.createMany({
    data: uploaded.map((p) => ({
      cookId,
      url: p.url,
      pathname: p.pathname,
    })),
  });

  const photos = await prisma.recipeCookPhoto.findMany({
    where: { cookId },
    orderBy: { createdAt: "asc" },
    select: photoSelect,
  });

  return NextResponse.json({ photos: photos.map(photoClientPayload) });
}
