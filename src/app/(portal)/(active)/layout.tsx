import { ActiveVendorGuard } from "@/features/vendor/presentation/ActiveVendorGuard";

export default function ActiveVendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ActiveVendorGuard>{children}</ActiveVendorGuard>;
}
