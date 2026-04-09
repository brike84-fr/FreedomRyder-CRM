import { AppShell } from "@/components/app-shell";
import { LeadDetailContent } from "@/components/lead-detail-content";
import { getLeadById, getEmailLogsForLead } from "@/lib/data";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, emailLogs] = await Promise.all([
    getLeadById(id),
    getEmailLogsForLead(id),
  ]);

  return (
    <AppShell>
      <LeadDetailContent leadId={id} lead={lead} emailLogs={emailLogs} />
    </AppShell>
  );
}
