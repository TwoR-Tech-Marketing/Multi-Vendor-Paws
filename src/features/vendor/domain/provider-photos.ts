import { PROVIDER_FIELD_LIMITS as L } from "@/features/vendor/domain/vendor-type-config";

/** Client limits for provider photos, the same as the Storage rule. */
export const PROVIDER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROVIDER_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROVIDER_PHOTOS_MAX = L.photoUrlsMax;

export type ProviderPhotoFileIssue = "photoTypeNotAllowed" | "photoTooLarge";

/** Checks a picked file before upload. Null when it can be uploaded. */
export function checkProviderPhotoFile(file: {
  type: string;
  size: number;
}): ProviderPhotoFileIssue | null {
  if (!(PROVIDER_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "photoTypeNotAllowed";
  }
  if (file.size >= PROVIDER_PHOTO_MAX_BYTES) return "photoTooLarge";
  return null;
}

/** Bucket and object path of a Firebase Storage download URL, or null. */
export function parseStorageObject(url: string): { bucket: string; path: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  try {
    if (parsed.hostname === "firebasestorage.googleapis.com") {
      const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/([^/]+)$/);
      if (!match) return null;
      return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
    }
    if (parsed.hostname === "storage.googleapis.com") {
      const match = parsed.pathname.match(/^\/([^/]+)\/(.+)$/);
      if (!match) return null;
      return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
    }
  } catch {
    return null;
  }
  return null;
}

/** Who owns the photos a change request may point to. */
export type ProviderPhotoOwner = {
  vendorId: string;
  /** Photos already on the vendor document, accepted unchanged. */
  storedUrls: readonly string[];
  /** Default Storage bucket, when known. */
  bucket?: string | null;
};

/**
 * True when `url` is a stored photo of the vendor or an object in the
 * default bucket under `vendors/{vendorId}/photos/`.
 */
export function isOwnProviderPhotoUrl(url: string, owner: ProviderPhotoOwner): boolean {
  if (owner.storedUrls.includes(url)) return true;
  const object = parseStorageObject(url);
  if (!object || object.path.includes("..")) return false;
  if (!object.path.startsWith(`vendors/${owner.vendorId}/photos/`)) return false;
  return !owner.bucket || object.bucket === owner.bucket;
}

/** True when both lists hold the same URLs in the same order. */
export function samePhotoList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((url, index) => url === b[index]);
}
