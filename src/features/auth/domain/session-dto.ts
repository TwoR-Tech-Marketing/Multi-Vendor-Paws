import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";
import type {
  PreferencesScope,
  VendorPreferences,
} from "@/shared/preferences/domain/types";

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
  /** Appearance and language, defaults filled. */
  preferences: VendorPreferences;
  /** "local" when there is no account record to save preferences on yet. */
  preferencesScope: PreferencesScope;
  /** True only when the account record already stores preferences. */
  preferencesSet: boolean;
};
