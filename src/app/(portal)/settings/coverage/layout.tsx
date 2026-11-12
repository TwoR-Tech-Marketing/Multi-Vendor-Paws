import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function CoverageLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="coverage">{children}</VendorScreenGuard>;
}
