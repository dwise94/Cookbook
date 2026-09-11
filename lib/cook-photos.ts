import { put, del, get } from "@vercel/blob";
import { nanoid } from "nanoid";

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const MAX_PHOTOS_PER_COOK = 6;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type UploadedPhoto = { url: string; pathname: string };

export type PhotoRow = {
  id: string;
  url: string;
  createdAt: Date | string;
};

export function photoClientPayload(photo: PhotoRow) {
  return {
    id: photo.id,
    url: `/api/cook-photos/${photo.id}`,
    createdAt: photo.createdAt,
  };
}

export function isAllowedImage(file: File): boolean {
  if (ALLOWED_TYPES.has(file.type.toLowerCase())) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("heic") || file.type.includes("heif")) return "heic";
  return "jpg";
}

export async function uploadCookPhotos(
  cookbookId: string,
  recipeId: string,
  files: File[]
): Promise<UploadedPhoto[]> {
  if (!blobConfigured()) {
    throw new Error("Photo uploads are not configured (missing BLOB_READ_WRITE_TOKEN).");
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const uploaded: UploadedPhoto[] = [];
  for (const file of files) {
    const pathname = `cooks/${cookbookId}/${recipeId}/${nanoid(12)}.${extensionFor(file)}`;
    // Buffer is more reliable than File in Vercel Node serverless / multipart form parsing.
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error("One of the selected photos was empty.");
    }
    const result = await put(pathname, bytes, {
      access: "private",
      contentType: file.type || "application/octet-stream",
      token,
    });
    uploaded.push({ url: result.url, pathname: result.pathname });
  }
  return uploaded;
}

export async function deleteBlobPath(pathname: string): Promise<void> {
  if (!blobConfigured()) return;
  await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export async function fetchPrivateBlob(pathnameOrUrl: string) {
  return get(pathnameOrUrl, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export function collectPhotoFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if ((key === "photos" || key === "photos[]" || key.startsWith("photo")) && value instanceof File) {
      if (value.size > 0) files.push(value);
    }
  }
  return files;
}

export function validatePhotoFiles(files: File[]): string | null {
  if (files.length > MAX_PHOTOS_PER_COOK) {
    return `You can upload at most ${MAX_PHOTOS_PER_COOK} photos.`;
  }
  for (const file of files) {
    if (!isAllowedImage(file)) {
      return "Photos must be JPEG, PNG, WebP, or HEIC.";
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return "Each photo must be 4MB or smaller.";
    }
  }
  return null;
}
