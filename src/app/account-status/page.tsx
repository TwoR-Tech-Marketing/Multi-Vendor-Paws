import { redirect } from "next/navigation";

import { Routes } from "@/constants/routes";

export default function LegacyAccountStatusPage() {
  redirect(Routes.vendor.profile);
}
