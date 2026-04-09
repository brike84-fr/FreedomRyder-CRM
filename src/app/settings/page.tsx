import { AppShell } from "@/components/app-shell";
import { SettingsContent } from "@/components/settings-content";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const [settings, supabase] = await Promise.all([
    getSettings(),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell>
      <SettingsContent
        settings={settings}
        userEmail={user?.email ?? ""}
      />
    </AppShell>
  );
}
