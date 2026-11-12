"use client";

import { PROVIDER_PHOTO_TYPES } from "@/features/vendor/domain/provider-photos";
import { ProviderPhotoThumb } from "@/features/vendor/presentation/ProviderPhotoThumb";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerPhotos.module.css";

/** A photo in the form: a stored URL, or a picked file with a local preview. */
export type ProviderPhotoItem = {
  id: string;
  url: string;
  file?: File;
};

type ProviderPhotoGridProps = {
  strings: AppStrings;
  items: ProviderPhotoItem[];
  max: number;
  disabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
};

/** Clinic and groomer photos in the profile form: thumbnails, add, remove. */
export function ProviderPhotoGrid({
  strings,
  items,
  max,
  disabled,
  onAdd,
  onRemove,
}: ProviderPhotoGridProps) {
  const t = strings.profile.photos;
  const canAdd = !disabled && items.length < max;

  return (
    <div className={styles.block}>
      <span className={styles.title}>{t.title}</span>
      <span className={styles.hint}>{t.hint.replace("{max}", String(max))}</span>
      {items.length === 0 && disabled ? <span className={styles.empty}>{t.empty}</span> : null}
      <div className={styles.grid}>
        {items.map((item, index) => {
          const position = String(index + 1);
          return (
            <ProviderPhotoThumb
              key={item.id}
              src={item.url}
              alt={t.alt.replace("{index}", position)}
              remove={
                disabled
                  ? undefined
                  : {
                      label: t.removeShort,
                      ariaLabel: t.remove.replace("{index}", position),
                      disabled,
                      onRemove: () => onRemove(item.id),
                    }
              }
            />
          );
        })}
        {canAdd ? (
          <label className={styles.addTile}>
            <input
              type="file"
              accept={PROVIDER_PHOTO_TYPES.join(",")}
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) onAdd(files);
              }}
            />
            {t.add}
          </label>
        ) : null}
      </div>
    </div>
  );
}
