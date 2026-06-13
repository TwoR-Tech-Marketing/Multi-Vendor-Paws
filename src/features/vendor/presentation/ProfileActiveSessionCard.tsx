"use client";

import { useMemo } from "react";

import { Strings } from "@/constants/strings";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePortalSignOut } from "@/features/vendor/presentation/PortalSignOutContext";
import {
  IconChevronRight,
  IconClock,
  IconComputer,
  IconLocation,
  IconLogout,
} from "@/features/vendor/presentation/PortalNavIcons";
import { getVendorSessionMetadata } from "@/shared/lib/session-metadata";

import portalStyles from "./portal.module.css";
import styles from "./profile.module.css";

export function ProfileActiveSessionCard() {
  const { user, isLoggingOut } = usePortalSession();
  const { requestSignOut } = usePortalSignOut();

  const session = useMemo(() => getVendorSessionMetadata(user), [user]);

  const signOutLabel = isLoggingOut
    ? Strings.common.signingOut
    : Strings.common.signOut;

  const rows = [
    { label: Strings.session.device, value: session.deviceLabel, Icon: IconComputer },
    { label: Strings.session.signedIn, value: session.signedInLabel, Icon: IconClock },
    { label: Strings.session.lastLogin, value: session.lastLoginLabel, Icon: IconClock },
    {
      label: Strings.session.accountCreated,
      value: session.accountCreatedLabel,
      Icon: IconClock,
    },
    { label: Strings.session.location, value: session.locationLabel, Icon: IconLocation },
  ];

  return (
    <article className={`${portalStyles.panel} ${styles.sessionCard}`} aria-label={Strings.session.title}>
      <div className={styles.sessionCardHeader}>
        <div className={styles.sessionIconBadge}>
          <IconLogout width={18} height={18} />
        </div>
        <h3 className={styles.panelTitle}>{Strings.session.title}</h3>
      </div>

      <div className={styles.sessionDivider} aria-hidden />

      <div className={styles.sessionMetaList}>
        {rows.map(({ label, value, Icon }) => (
          <div key={label} className={styles.sessionMetaRow}>
            <div className={styles.sessionMetaIcon} aria-hidden>
              <Icon width={16} height={16} />
            </div>
            <div className={styles.sessionMetaText}>
              <div className={styles.sessionMetaLabel}>{label}</div>
              <div className={styles.sessionMetaValue}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.signOutBtn}
        onClick={requestSignOut}
        disabled={isLoggingOut}
      >
        <span className={styles.signOutLeft}>
          <IconLogout width={18} height={18} />
          <span className={styles.signOutText}>{signOutLabel}</span>
        </span>
        <IconChevronRight className={styles.signOutArrow} width={12} height={12} />
      </button>
    </article>
  );
}
