import "server-only";

export { isProduction } from "@/lib/env.shared";
export {
  getFirebaseAdminEnv,
  getFirebaseAdminSetupMessage,
  getMissingFirebaseAdminEnvKeys,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin.env";
