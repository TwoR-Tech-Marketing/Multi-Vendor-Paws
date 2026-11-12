import { Strings } from "@/constants/strings";
import { StatementSkeleton } from "@/features/financials/presentation/StatementSkeleton";

export default function StatementLoading() {
  return <StatementSkeleton label={Strings.common.loading} />;
}
