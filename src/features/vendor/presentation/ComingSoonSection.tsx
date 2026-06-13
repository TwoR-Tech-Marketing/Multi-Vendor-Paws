"use client";

import { IconSparkle } from "./PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";
import styles from "./portal.module.css";

export function ComingSoonSection() {
  const strings = useStrings();

  return (
    <section className={styles.comingSoon} aria-labelledby="coming-soon-title">
      <div className={styles.comingSoonIcon}>
        <IconSparkle width={28} height={28} />
      </div>
      <h2 id="coming-soon-title">{strings.common.comingSoon}</h2>
      <p>{strings.common.comingSoonDescription}</p>
    </section>
  );
}
