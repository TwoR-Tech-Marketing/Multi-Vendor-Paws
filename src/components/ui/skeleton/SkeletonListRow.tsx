import { SkeletonAvatar } from "./SkeletonAvatar";
import { SkeletonText } from "./SkeletonText";
import styles from "./skeleton.module.css";

type SkeletonListRowProps = {
  metaWidth?: number | string;
  titleWidth?: number | string;
  bodyWidth?: number | string;
  avatarSize?: number;
};

export function SkeletonListRow({
  metaWidth = 56,
  titleWidth = "72%",
  bodyWidth = "48%",
  avatarSize = 44,
}: SkeletonListRowProps) {
  return (
    <div className={styles.listRow}>
      <SkeletonAvatar size={avatarSize} />
      <div className={styles.listRowBody}>
        <SkeletonText size="lg" width={titleWidth} />
        <SkeletonText size="sm" width={bodyWidth} />
      </div>
      <SkeletonText className={styles.listRowMeta} size="sm" width={metaWidth} />
    </div>
  );
}
