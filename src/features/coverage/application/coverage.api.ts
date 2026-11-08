import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";
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
  const callable = httpsCallable<Record<string, never>, GetCoverageResponse>(
    firebaseFunctions,
    "vendors-getVendorDeliveryCoverage",
  );
  const result = await callable({});
  return result.data;
}

export async function saveMyDeliveryCoverage(
  deliveryCoverage: DeliveryCoverage,
): Promise<SetCoverageResponse> {
  const callable = httpsCallable<
    { deliveryCoverage: DeliveryCoverage },
    SetCoverageResponse
  >(firebaseFunctions, "vendors-setVendorDeliveryCoverage");
  const result = await callable({ deliveryCoverage });
  return result.data;
}

export async function fetchGovernoratesForCoverage(): Promise<GovernorateOption[]> {
  const callable = httpsCallable<Record<string, never>, ListGovResponse>(
    firebaseFunctions,
    "vendors-listGovernoratesForCoverage",
  );
  const result = await callable({});
  return result.data.items ?? [];
}
