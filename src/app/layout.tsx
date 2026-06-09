import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "@/shared/theme/colors.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

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
    <html lang="en">
      <body className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
