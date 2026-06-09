import Image from "next/image";
import Link from "next/link";

import styles from "./PawlioLogo.module.css";

type PawlioLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function PawlioLogo({
  size = 56,
  className,
  priority = false,
}: PawlioLogoProps) {
  const imageSize = Math.round(size * 0.78);

  return (
    <span
      className={`${styles.wrap} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/pawlio-logo.png"
        alt="Pawlio"
        width={imageSize}
        height={imageSize}
        className={styles.image}
        unoptimized
        priority={priority}
      />
    </span>
  );
}

type PawlioBrandProps = {
  size?: number;
  tagline?: string;
  href?: string;
  priority?: boolean;
  layout?: "stack" | "inline";
  className?: string;
};

export function PawlioBrand({
  size = 48,
  tagline = "Vendor portal",
  href,
  priority = false,
  layout = "stack",
  className,
}: PawlioBrandProps) {
  const layoutClass = layout === "inline" ? styles.brandInline : styles.brand;
  const textBlock = (
    <div className={styles.brandText}>
      <strong className={styles.brandName}>Pawlio</strong>
      {tagline ? <span className={styles.brandTagline}>{tagline}</span> : null}
    </div>
  );

  const content = (
    <>
      <PawlioLogo size={size} priority={priority} />
      {textBlock}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${layoutClass} ${className ?? ""}`}>
        {content}
      </Link>
    );
  }

  return <div className={`${layoutClass} ${className ?? ""}`}>{content}</div>;
}
