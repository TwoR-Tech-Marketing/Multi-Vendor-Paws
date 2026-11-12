import { describe, expect, it } from "vitest";

import {
  checkProviderPhotoFile,
  isOwnProviderPhotoUrl,
  parseStorageObject,
  PROVIDER_PHOTOS_MAX,
  samePhotoList,
} from "@/features/vendor/domain/provider-photos";
import { StoragePaths } from "@/lib/storage-paths";

const MB = 1024 * 1024;

function downloadUrl(bucket: string, path: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=t`;
}

describe("provider photos", () => {
  it("allows six photos", () => {
    expect(PROVIDER_PHOTOS_MAX).toBe(6);
  });

  it("accepts jpeg, png and webp under 5 MB only", () => {
    expect(checkProviderPhotoFile({ type: "image/jpeg", size: MB })).toBeNull();
    expect(checkProviderPhotoFile({ type: "image/png", size: MB })).toBeNull();
    expect(checkProviderPhotoFile({ type: "image/webp", size: 5 * MB - 1 })).toBeNull();
    expect(checkProviderPhotoFile({ type: "image/gif", size: MB })).toBe("photoTypeNotAllowed");
    expect(checkProviderPhotoFile({ type: "", size: MB })).toBe("photoTypeNotAllowed");
    expect(checkProviderPhotoFile({ type: "image/png", size: 5 * MB })).toBe("photoTooLarge");
  });

  it("builds the photos folder path", () => {
    expect(StoragePaths.vendorProviderPhoto("v1", "my photo!.png")).toMatch(
      /^vendors\/v1\/photos\/\d+_my_photo_\.png$/,
    );
  });

  it("parses both Storage URL forms", () => {
    expect(parseStorageObject(downloadUrl("b1", "vendors/v1/photos/1_a.png"))).toEqual({
      bucket: "b1",
      path: "vendors/v1/photos/1_a.png",
    });
    expect(parseStorageObject("https://storage.googleapis.com/b1/vendors/v1/photos/a.png")).toEqual({
      bucket: "b1",
      path: "vendors/v1/photos/a.png",
    });
    expect(parseStorageObject("https://example.com/a.png")).toBeNull();
    expect(parseStorageObject("not a url")).toBeNull();
  });

  it("accepts own photos folder, stored photos, and refuses the rest", () => {
    const owner = { vendorId: "v1", storedUrls: ["https://example.com/old.png"], bucket: "b1" };
    expect(isOwnProviderPhotoUrl(downloadUrl("b1", "vendors/v1/photos/1_a.png"), owner)).toBe(true);
    expect(isOwnProviderPhotoUrl("https://example.com/old.png", owner)).toBe(true);
    expect(isOwnProviderPhotoUrl(downloadUrl("b1", "vendors/v2/photos/1_a.png"), owner)).toBe(false);
    expect(isOwnProviderPhotoUrl(downloadUrl("b1", "vendors/v1/logo/1_a.png"), owner)).toBe(false);
    expect(isOwnProviderPhotoUrl(downloadUrl("b2", "vendors/v1/photos/1_a.png"), owner)).toBe(false);
    expect(isOwnProviderPhotoUrl("https://example.com/new.png", owner)).toBe(false);
  });

  it("compares lists by order", () => {
    expect(samePhotoList(["a", "b"], ["a", "b"])).toBe(true);
    expect(samePhotoList(["a", "b"], ["b", "a"])).toBe(false);
    expect(samePhotoList([], ["a"])).toBe(false);
  });
});
