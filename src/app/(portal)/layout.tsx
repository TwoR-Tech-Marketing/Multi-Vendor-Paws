import { VendorPortalLayout } from "@/features/vendor/presentation/VendorPortalLayout";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorPortalLayout>{children}</VendorPortalLayout>;
}
