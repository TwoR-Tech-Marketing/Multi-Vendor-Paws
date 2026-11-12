import { BranchDetailSection } from "@/features/branches/presentation/BranchDetailSection";

type BranchDetailPageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchDetailPage({ params }: BranchDetailPageProps) {
  const { branchId } = await params;
  return <BranchDetailSection branchId={decodeURIComponent(branchId)} />;
}
