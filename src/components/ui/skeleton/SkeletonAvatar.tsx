import { SkeletonBox } from "./SkeletonBox";
import styles from "./skeleton.module.css";

type SkeletonAvatarProps = {
  size?: number;
  className?: string;
};

export function SkeletonAvatar({ size = 40, className }: SkeletonAvatarProps) {
  return (
    <SkeletonBox
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      borderRadius="var(--radius-full)"
    />
  );
}
