import { SkeletonBox } from "./SkeletonBox";
import styles from "./skeleton.module.css";

type SkeletonButtonProps = {
  width?: number | string;
  className?: string;
};

export function SkeletonButton({ width = "100%", className }: SkeletonButtonProps) {
  return (
    <SkeletonBox
      className={[styles.button, className].filter(Boolean).join(" ")}
      width={width}
      height="var(--control-height)"
      borderRadius="var(--radius-control)"
    />
  );
}
