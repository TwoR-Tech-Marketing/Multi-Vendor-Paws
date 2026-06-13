import { Strings } from "@/constants/strings";

import { IconSparkle } from "./PortalNavIcons";
import styles from "./portal.module.css";

export function ComingSoonSection() {
  return (
    <section className={styles.comingSoon} aria-labelledby="coming-soon-title">
      <div className={styles.comingSoonIcon}>
        <IconSparkle width={28} height={28} />
      </div>
      <h2 id="coming-soon-title">{Strings.common.comingSoon}</h2>
      <p>{Strings.common.comingSoonDescription}</p>
    </section>
  );
}
