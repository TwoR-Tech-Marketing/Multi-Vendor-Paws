import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function AvailabilityLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="availability">{children}</VendorScreenGuard>;
}
