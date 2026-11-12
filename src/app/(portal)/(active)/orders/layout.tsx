import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="orders">{children}</VendorScreenGuard>;
}
