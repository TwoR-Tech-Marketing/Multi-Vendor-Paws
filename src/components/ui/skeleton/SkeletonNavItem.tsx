import { SkeletonIcon } from "./SkeletonIcon";
import { SkeletonText } from "./SkeletonText";
import styles from "./skeleton.module.css";

type SkeletonNavItemProps = {
  labelWidth?: number | string;
  showRule?: boolean;
};

export function SkeletonNavItem({ labelWidth = 72, showRule = true }: SkeletonNavItemProps) {
  return (
    <div className={styles.navGroup}>
      <div className={styles.navItem}>
        <SkeletonIcon />
        <SkeletonText width={labelWidth} />
      </div>
      {showRule ? <span className={styles.navRule} aria-hidden /> : null}
    </div>
  );
}
