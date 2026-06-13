import { SkeletonBox } from "./SkeletonBox";
import styles from "./skeleton.module.css";

type SkeletonIconProps = {
  size?: number;
  className?: string;
};

export function SkeletonIcon({ size = 22, className }: SkeletonIconProps) {
  return (
    <SkeletonBox
      className={[styles.icon, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      borderRadius="var(--radius-sm)"
    />
  );
}
