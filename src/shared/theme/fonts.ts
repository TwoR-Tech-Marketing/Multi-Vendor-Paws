import localFont from "next/font/local";

/**
 * IBM Plex Sans and IBM Plex Sans Arabic (SIL Open Font License 1.1, see the
 * OFL text files next to the font files). The variables are declared on
 * <body>; colors.css resolves --font from them.
 */
export const plexSans = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-Regular-Latin1.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSans-Medium-Latin1.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSans-SemiBold-Latin1.woff2", weight: "600", style: "normal" },
  ],
  variable: "--tp-font-latin",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const plexSansArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--tp-font-arabic",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});
