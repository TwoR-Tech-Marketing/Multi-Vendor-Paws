import { VendorPortalLayout } from "@/features/vendor/presentation/VendorPortalLayout";
import { FirebaseConfigGate } from "@/shared/components/config-error/FirebaseConfigGate";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseConfigGate>
      <VendorPortalLayout>{children}</VendorPortalLayout>
    </FirebaseConfigGate>
  );
}
