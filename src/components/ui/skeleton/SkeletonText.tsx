import styles from "./skeleton.module.css";
import { skeletonClassName } from "./skeletonClassName";

type SkeletonTextProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  width?: number | string;
};

export function SkeletonText({ className, size = "md", width = "100%" }: SkeletonTextProps) {
  const rootClassName = skeletonClassName(
    styles.text,
    size === "sm" ? styles.textSm : size === "lg" ? styles.textLg : undefined,
    className,
  );

  return <span className={rootClassName} aria-hidden style={{ width }} />;
}
