"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Routes } from "@/constants/routes";
import { Strings } from "@/constants/strings";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { IconMenu } from "@/features/vendor/presentation/PortalNavIcons";

import styles from "./portal.module.css";

type PortalTopbarProps = {
  title: string;
  subtitle: string;
  onMenuOpen: () => void;
  isMenuOpen: boolean;
};

function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function PortalTopbar({
  title,
  subtitle,
  onMenuOpen,
  isMenuOpen,
}: PortalTopbarProps) {
  const pathname = usePathname();
  const { profile, user } = usePortalSession();
  const email = user.email ?? profile.email;
  const initials = getInitials(profile.ownerName, email);
  const isProfileActive = pathname.startsWith(Routes.vendor.profile);

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuOpen}
        aria-label={Strings.portal.openMenu}
        aria-expanded={isMenuOpen}
      >
        <IconMenu />
      </button>

      <div className={styles.topbarTitle}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className={styles.topbarActions}>
        <Link
          href={Routes.vendor.profile}
          prefetch
          scroll={false}
          className={`${styles.profileBtn} ${isProfileActive ? styles.profileBtnActive : ""}`}
          aria-label={Strings.portal.openProfile}
          aria-current={isProfileActive ? "page" : undefined}
        >
          <span className={styles.avatar}>{initials}</span>
          <div className={styles.userPillText}>
            <strong>{profile.ownerName}</strong>
            <small>{email}</small>
          </div>
        </Link>
      </div>
    </header>
  );
}
