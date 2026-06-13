"use client";

import { useMemo } from "react";

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
import { useStrings } from "@/shared/preferences/PreferencesContext";

import portalStyles from "./portal.module.css";
import styles from "./profile.module.css";

export function ProfileActiveSessionCard() {
  const { user, isLoggingOut } = usePortalSession();
  const { requestSignOut } = usePortalSignOut();
  const strings = useStrings();

  const session = useMemo(() => getVendorSessionMetadata(user), [user]);

  const signOutLabel = isLoggingOut
    ? strings.common.signingOut
    : strings.common.signOut;

  const rows = [
    { label: strings.session.device, value: session.deviceLabel, Icon: IconComputer },
    { label: strings.session.signedIn, value: session.signedInLabel, Icon: IconClock },
    { label: strings.session.lastLogin, value: session.lastLoginLabel, Icon: IconClock },
    {
      label: strings.session.accountCreated,
      value: session.accountCreatedLabel,
      Icon: IconClock,
    },
    { label: strings.session.location, value: session.locationLabel, Icon: IconLocation },
  ];

  return (
    <article className={`${portalStyles.panel} ${styles.sessionCard}`} aria-label={strings.session.title}>
      <div className={styles.sessionCardHeader}>
        <div className={styles.sessionIconBadge}>
          <IconLogout width={18} height={18} />
        </div>
        <h3 className={styles.panelTitle}>{strings.session.title}</h3>
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

      <div className={styles.signOutBtnWrap}>
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
      </div>
    </article>
  );
}
