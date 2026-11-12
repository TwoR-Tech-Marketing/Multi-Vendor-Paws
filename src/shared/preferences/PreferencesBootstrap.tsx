import { buildPreferencesBootstrapScript } from "@/shared/preferences/domain/bootstrap-script";

const bootstrapScript = buildPreferencesBootstrapScript();

export function PreferencesBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
      suppressHydrationWarning
    />
  );
}
