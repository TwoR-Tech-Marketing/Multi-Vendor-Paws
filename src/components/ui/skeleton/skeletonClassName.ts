import styles from "./skeleton.module.css";

export function skeletonClassName(...parts: Array<string | undefined | false>): string {
  return [styles.shimmer, ...parts.filter(Boolean)].join(" ");
}
