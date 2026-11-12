import { CouponDetailSection } from "@/features/coupons/presentation/CouponDetailSection";

type CouponDetailPageProps = {
  params: Promise<{ couponId: string }>;
};

export default async function CouponDetailPage({ params }: CouponDetailPageProps) {
  const { couponId } = await params;
  return <CouponDetailSection couponId={decodeURIComponent(couponId)} />;
}
