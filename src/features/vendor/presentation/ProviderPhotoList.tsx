import { ProviderPhotoThumb } from "@/features/vendor/presentation/ProviderPhotoThumb";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerPhotos.module.css";

type ProviderPhotoListProps = {
  strings: AppStrings;
  title: string;
  urls: readonly string[];
};

/** Read only photo thumbnails, for example the photos a request asks for. */
export function ProviderPhotoList({ strings, title, urls }: ProviderPhotoListProps) {
  const t = strings.profile.photos;
  return (
    <div className={styles.block}>
      <span className={styles.title}>{title}</span>
      {urls.length === 0 ? (
        <span className={styles.empty}>{t.cleared}</span>
      ) : (
        <div className={styles.grid}>
          {urls.map((url, index) => (
            <ProviderPhotoThumb
              key={url}
              src={url}
              alt={t.alt.replace("{index}", String(index + 1))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
