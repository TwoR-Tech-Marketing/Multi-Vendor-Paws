/**
 * Shrinks a photo so its long side is at most `maxSide` pixels, keeping the
 * type. Returns the original file when it is already small, when the browser
 * cannot decode it (HEIC in most browsers) or when anything fails.
 */
export async function resizePhotoFile(file: File, maxSide: number): Promise<File> {
  if (file.type === "image/heic" || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = maxSide / Math.max(bitmap.width, bitmap.height);
    if (scale >= 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, 0.85),
    );
    return blob && blob.type === file.type ? new File([blob], file.name, { type: file.type }) : file;
  } catch {
    return file;
  }
}
