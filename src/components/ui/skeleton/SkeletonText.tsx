import styles from "./skeleton.module.css";

type SkeletonTextProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  width?: number | string;
};

export function SkeletonText({ className, size = "md", width = "100%" }: SkeletonTextProps) {
  const sizeClass =
    size === "sm" ? styles.textSm : size === "lg" ? styles.textLg : undefined;

  const rootClassName = [styles.text, sizeClass, className].filter(Boolean).join(" ");

  return <span className={rootClassName} aria-hidden style={{ width }} />;
}
