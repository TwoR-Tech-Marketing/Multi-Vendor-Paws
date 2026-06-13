import type { CSSProperties } from "react";

import styles from "./skeleton.module.css";

type SkeletonBoxProps = {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: CSSProperties["borderRadius"];
};

export function SkeletonBox({
  className,
  width,
  height,
  borderRadius,
}: SkeletonBoxProps) {
  const rootClassName = [styles.box, className].filter(Boolean).join(" ");

  return (
    <span
      className={rootClassName}
      aria-hidden
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}
