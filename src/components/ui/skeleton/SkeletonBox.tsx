import type { CSSProperties } from "react";

import styles from "./skeleton.module.css";
import { skeletonClassName } from "./skeletonClassName";

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
  const rootClassName = skeletonClassName(styles.box, className);

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
