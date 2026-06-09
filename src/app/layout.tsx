import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/shared/theme/colors.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font",
});

export const metadata: Metadata = {
  title: "Tender Paws Vendor Portal",
  description: "Multi-vendor vendor portal for Tender Paws",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
