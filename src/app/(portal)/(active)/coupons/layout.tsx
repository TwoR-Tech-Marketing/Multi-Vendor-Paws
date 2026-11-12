import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function CouponsLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="coupons">{children}</VendorScreenGuard>;
}
