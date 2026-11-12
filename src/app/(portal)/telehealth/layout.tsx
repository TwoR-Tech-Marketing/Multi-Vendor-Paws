import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function TelehealthLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="telehealth">{children}</VendorScreenGuard>;
}
