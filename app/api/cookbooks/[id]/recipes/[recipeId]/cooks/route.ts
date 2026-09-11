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

const photoSelect = {
  id: true,
  url: true,
  createdAt: true,
} as const;

function parseRating(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return Number(raw);
  return NaN;
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

  const contentType = request.headers.get("content-type") ?? "";
  let rating = NaN;
  let photoFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    rating = parseRating(formData.get("rating"));
    photoFiles = collectPhotoFiles(formData);
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    rating = parseRating((body as Record<string, unknown>).rating);
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Please rate this cook from 1 to 5 stars." },
      { status: 400 }
    );
  }

  if (photoFiles.length > 0) {
    if (!blobConfigured()) {
      return NextResponse.json(
        {
          error:
            "Photo uploads are not configured yet. Add BLOB_READ_WRITE_TOKEN, or log the cook without photos.",
        },
        { status: 503 }
      );
    }
    const invalid = validatePhotoFiles(photoFiles);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
  }

  let uploaded: { url: string; pathname: string }[] = [];
  try {
    if (photoFiles.length > 0) {
      uploaded = await uploadCookPhotos(cookbookId, recipeId, photoFiles);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Cook photo upload error:", err.message);
    return NextResponse.json({ error: "Could not upload photos." }, { status: 500 });
  }

  if (uploaded.length > MAX_PHOTOS_PER_COOK) {
    return NextResponse.json(
      { error: `You can upload at most ${MAX_PHOTOS_PER_COOK} photos.` },
      { status: 400 }
    );
  }

  const cook = await prisma.recipeCook.create({
    data: {
      recipeId,
      userId: auth.user.userId,
      cookName: auth.user.username,
      rating,
      photos: {
        create: uploaded.map((p) => ({
          url: p.url,
          pathname: p.pathname,
        })),
      },
    },
    select: {
      id: true,
      userId: true,
      cookName: true,
      rating: true,
      cookedAt: true,
      photos: {
        orderBy: { createdAt: "asc" },
        select: photoSelect,
      },
    },
  });

  return NextResponse.json({
    ...cook,
    photos: cook.photos.map(photoClientPayload),
  });
}
