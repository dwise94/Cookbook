/** Compress images in the browser before upload to stay under Vercel body limits. */
export async function prepareCookPhoto(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  // HEIC/HEIF often can't be drawn to canvas in browsers — send as-is if small enough.
  if (type.includes("heic") || type.includes("heif")) {
    return file;
  }
  if (!type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function prepareCookPhotos(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => prepareCookPhoto(f)));
}
