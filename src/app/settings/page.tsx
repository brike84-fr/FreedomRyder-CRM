import { AppShell } from "@/components/app-shell";
import { SettingsContent } from "@/components/settings-content";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell>
      <SettingsContent userEmail={user?.email ?? ""} />
    </AppShell>
  );
}
