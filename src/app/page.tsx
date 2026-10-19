import { LandingClient } from "@/features/auth/presentation/LandingClient";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

export default function HomePage() {
  return (
    <PreferencesProvider>
      <LandingClient />
    </PreferencesProvider>
  );
}
