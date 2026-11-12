import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="products">{children}</VendorScreenGuard>;
}
