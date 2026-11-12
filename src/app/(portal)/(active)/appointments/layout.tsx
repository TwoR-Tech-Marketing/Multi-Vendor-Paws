import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="appointments">{children}</VendorScreenGuard>;
}
