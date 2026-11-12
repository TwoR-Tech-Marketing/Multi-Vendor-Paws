import { AvailabilitySection } from "@/features/availability/presentation/AvailabilitySection";

type AvailabilityPageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function AvailabilityPage({ params }: AvailabilityPageProps) {
  const { branchId } = await params;
  return <AvailabilitySection branchId={decodeURIComponent(branchId)} />;
}
