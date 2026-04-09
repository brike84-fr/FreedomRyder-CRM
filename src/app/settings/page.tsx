import { AppShell } from "@/components/app-shell";
import { SettingsContent } from "@/components/settings-content";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <AppShell>
      <SettingsContent settings={settings} />
    </AppShell>
  );
}
