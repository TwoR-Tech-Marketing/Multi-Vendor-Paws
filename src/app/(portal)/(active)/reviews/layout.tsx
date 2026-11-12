import { VendorScreenGuard } from "@/features/vendor/presentation/VendorScreenGuard";

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <VendorScreenGuard screen="reviews">{children}</VendorScreenGuard>;
}
