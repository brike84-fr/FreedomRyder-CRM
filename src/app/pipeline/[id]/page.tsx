import { AppShell } from "@/components/app-shell";
import { LeadDetailContent } from "@/components/lead-detail-content";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <LeadDetailContent leadId={id} />
    </AppShell>
  );
}
