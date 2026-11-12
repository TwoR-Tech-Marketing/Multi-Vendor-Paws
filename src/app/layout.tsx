import type { Metadata } from "next";

import "@/shared/theme/tokens.generated.css";
import "@/shared/theme/colors.css";
import "@/shared/theme/brand-art.css";
import "./globals.css";

import { PreferencesBootstrap } from "@/shared/preferences/PreferencesBootstrap";
import { plexSans, plexSansArabic } from "@/shared/theme/fonts";

export const metadata: Metadata = {
  title: "Pawlio — Vendor Portal",
  description: "Sell pet products on Pawlio. Manage your store, orders, and earnings.",
  icons: {
    icon: [{ url: "/pawlio-logo.png", type: "image/png" }],
    apple: "/pawlio-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PreferencesBootstrap />
      </head>
      <body className={`${plexSans.variable} ${plexSansArabic.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
