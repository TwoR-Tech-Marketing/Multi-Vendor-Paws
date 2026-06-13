import { PREFERENCE_STORAGE_KEYS } from "@/shared/preferences/domain/types";

const bootstrapScript = `
(function () {
  try {
    var theme = localStorage.getItem("${PREFERENCE_STORAGE_KEYS.theme}");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    var locale = localStorage.getItem("${PREFERENCE_STORAGE_KEYS.locale}");
    if (locale === "ar") {
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
    }
  } catch (e) {}
})();
`;

export function PreferencesBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
      suppressHydrationWarning
    />
  );
}
