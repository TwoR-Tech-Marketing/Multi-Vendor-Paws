import { invokeCallable } from "@/lib/callable";
import type {
  DeliveryCoverage,
  GovernorateOption,
} from "@/features/coverage/domain/types";

type GetCoverageResponse = {
  ok: boolean;
  vendorType: string;
  deliveryCoverage: DeliveryCoverage | null;
  source: string;
};

type SetCoverageResponse = {
  ok: boolean;
  deliveryCoverage: DeliveryCoverage;
};

type ListGovResponse = {
  ok: boolean;
  items: GovernorateOption[];
};

export async function fetchMyDeliveryCoverage(): Promise<GetCoverageResponse> {
  return invokeCallable<GetCoverageResponse>("vendors-getVendorDeliveryCoverage", {});
}

export async function saveMyDeliveryCoverage(
  deliveryCoverage: DeliveryCoverage,
): Promise<SetCoverageResponse> {
  return invokeCallable<SetCoverageResponse>("vendors-setVendorDeliveryCoverage", {
    deliveryCoverage,
  });
}

export async function fetchGovernoratesForCoverage(): Promise<GovernorateOption[]> {
  const result = await invokeCallable<ListGovResponse>(
    "vendors-listGovernoratesForCoverage",
    {},
  );
  return result.items ?? [];
}
