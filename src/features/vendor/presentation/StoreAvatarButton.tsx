"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Routes } from "@/constants/routes";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { getStoreInitials } from "@/shared/lib/store-branding";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

export function StoreAvatarButton() {
  const pathname = usePathname();
  const { storeBranding } = usePortalSession();
  const strings = useStrings();
  const isProfileActive = pathname.startsWith(Routes.vendor.profile);
  const initials = getStoreInitials(storeBranding.storeName);

  return (
    <Link
      href={Routes.vendor.profile}
      prefetch
      scroll={false}
      className={`${styles.storeAvatar} ${isProfileActive ? styles.storeAvatarActive : ""}`}
      aria-label={strings.portal.openProfile}
      aria-current={isProfileActive ? "page" : undefined}
    >
      {storeBranding.logoUrl ? (
        <Image
          src={storeBranding.logoUrl}
          alt=""
          width={48}
          height={48}
          className={styles.storeAvatarImage}
          unoptimized
        />
      ) : (
        <span className={styles.storeAvatarInitials}>{initials}</span>
      )}
    </Link>
  );
}
