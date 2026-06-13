"use client";

import { useRouter } from "next/navigation";

import { IconChevronLeft } from "@/features/vendor/presentation/PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

export function PortalBackButton() {
  const router = useRouter();
  const strings = useStrings();

  function onBack() {
    router.back();
  }

  return (
    <button
      type="button"
      className={styles.backBtn}
      onClick={onBack}
      aria-label={strings.portal.goBack}
    >
      <IconChevronLeft className={styles.backChevron} width={22} height={22} />
    </button>
  );
}
