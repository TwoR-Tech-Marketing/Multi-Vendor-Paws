import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="branches">{children}</VendorScreenGuard>;
}
