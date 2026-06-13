import { SkeletonBox } from "./SkeletonBox";
import styles from "./skeleton.module.css";

type SkeletonFieldProps = {
  className?: string;
  width?: number | string;
};

export function SkeletonField({ className, width = "100%" }: SkeletonFieldProps) {
  return (
    <SkeletonBox
      className={[styles.field, className].filter(Boolean).join(" ")}
      width={width}
      height="var(--control-height)"
      borderRadius="var(--radius-control)"
    />
  );
}
