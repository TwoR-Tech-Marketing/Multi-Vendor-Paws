import { OrderDetailSection } from "@/features/orders/presentation/OrderDetailSection";

type OrderDetailPageProps = {
  params: Promise<{ vendorOrderId: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { vendorOrderId } = await params;
  return <OrderDetailSection vendorOrderId={vendorOrderId} />;
}
