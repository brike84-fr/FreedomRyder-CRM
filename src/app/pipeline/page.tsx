import { AppShell } from "@/components/app-shell";
import { PipelineContent } from "@/components/pipeline-content";
import { getAllLeads } from "@/lib/data";

export default async function PipelinePage() {
  const leads = await getAllLeads();
  return (
    <AppShell>
      <PipelineContent leads={leads} />
    </AppShell>
  );
}
