import type { CSSProperties } from "react";

import styles from "./ThemedIcon.module.css";

export type ThemedIconTone =
  | "default"
  | "muted"
  | "accent"
  | "on-primary"
  | "logout";

type ThemedSvgIconProps = {
  src: string;
  className?: string;
  tone?: ThemedIconTone;
  width?: number;
  height?: number;
};

const toneClass: Record<ThemedIconTone, string> = {
  default: styles.toneDefault,
  muted: styles.toneMuted,
  accent: styles.toneAccent,
  "on-primary": styles.toneOnPrimary,
  logout: styles.toneLogout,
};

export function ThemedSvgIcon({
  src,
  className,
  tone = "default",
  width = 22,
  height = 22,
}: ThemedSvgIconProps) {
  const rootClassName = [styles.icon, toneClass[tone], className].filter(Boolean).join(" ");

  return (
    <span
      className={rootClassName}
      style={
        {
          width,
          height,
          "--icon-src": `url("${src}")`,
        } as CSSProperties
      }
      aria-hidden
    />
  );
}

type ThemedImageProps = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
};

export function ThemedImage({
  src,
  alt,
  className,
  width,
  height,
}: ThemedImageProps) {
  const rootClassName = [styles.image, className].filter(Boolean).join(" ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- themed PNG with CSS filter tokens
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={rootClassName}
      decoding="async"
    />
  );
}
