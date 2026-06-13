import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";

export type PortalUserDto = {
  uid: string;
  email: string;
  metadata: {
    lastSignInTime: string | null;
    creationTime: string | null;
  };
};

export type VendorSessionDto = {
  user: PortalUserDto;
  sessionKind: VendorSessionKind;
  profile: VendorProfile;
  storeBranding: {
    storeName: string;
    logoUrl: string | null;
  };
};
