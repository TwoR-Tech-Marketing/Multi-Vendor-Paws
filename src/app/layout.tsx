import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi Vendor Paws",
  description: "TenderPaws multi-vendor web platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
