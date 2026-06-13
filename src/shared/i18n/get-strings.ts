import { Strings } from "@/constants/strings";
import { arStrings } from "@/shared/i18n/locales/ar";
import type { AppLocale } from "@/shared/preferences/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

export function getStrings(locale: AppLocale): AppStrings {
  return locale === "ar" ? arStrings : Strings;
}
