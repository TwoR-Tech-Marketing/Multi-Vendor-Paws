"use client";

import Image from "next/image";
import { useState } from "react";

import { SkeletonBox } from "@/components/ui/skeleton";

import styles from "./providerPhotos.module.css";

type ProviderPhotoThumbProps = {
  src: string;
  alt: string;
  /** Visible remove label and its accessible name; no button when absent. */
  remove?: { label: string; ariaLabel: string; disabled: boolean; onRemove: () => void };
};

/** One photo tile: a shimmer until the image has loaded. */
export function ProviderPhotoThumb({ src, alt, remove }: ProviderPhotoThumbProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  return (
    <div className={styles.tile}>
      {loaded ? null : <SkeletonBox className={styles.tileSkeleton} />}
      <Image
        src={src}
        alt={alt}
        width={96}
        height={96}
        unoptimized
        className={`${styles.tileImage} ${loaded ? styles.tileImageLoaded : ""}`}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setLoadedSrc(src)}
      />
      {remove ? (
        <button
          type="button"
          className={styles.removeBtn}
          aria-label={remove.ariaLabel}
          disabled={remove.disabled}
          onClick={remove.onRemove}
        >
          {remove.label}
        </button>
      ) : null}
    </div>
  );
}
