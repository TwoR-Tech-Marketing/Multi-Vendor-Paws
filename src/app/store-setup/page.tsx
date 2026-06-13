import { redirect } from "next/navigation";

import { Routes } from "@/constants/routes";

export default function LegacyStoreSetupPage() {
  redirect(Routes.vendor.profile);
}
