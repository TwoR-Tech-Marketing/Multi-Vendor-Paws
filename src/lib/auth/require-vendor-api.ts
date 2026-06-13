import "server-only";

import type { VendorSessionDto } from "@/features/auth/domain/session-dto";
import { getVendorSessionFromCookies } from "@/lib/auth/session.server";

export type VendorApiContext = {
  session: VendorSessionDto;
  vendorId: string;
  uid: string;
};

export async function getVendorApiContext(): Promise<VendorApiContext | null> {
  const session = await getVendorSessionFromCookies();
  if (!session) return null;

  return {
    session,
    vendorId: session.profile.vendorId,
    uid: session.user.uid,
  };
}

export async function getActiveVendorApiContext(): Promise<VendorApiContext | null> {
  const context = await getVendorApiContext();
  if (!context) return null;
  if (context.session.sessionKind !== "active") return null;
  return context;
}
