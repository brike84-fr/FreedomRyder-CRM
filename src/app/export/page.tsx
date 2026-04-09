import { AppShell } from "@/components/app-shell";
import { ExportContent } from "@/components/export-content";
import { getBobsLeads } from "@/lib/data";

export default async function ExportPage() {
  const bobsLeads = await getBobsLeads();
  return (
    <AppShell>
      <ExportContent bobsLeads={bobsLeads} />
    </AppShell>
  );
}
