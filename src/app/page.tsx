import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/components/dashboard-content";
import {
  getDashboardStats,
  getAllLeads,
  getNotifications,
} from "@/lib/data";

export default async function DashboardPage() {
  const [stats, allLeads, notifications] = await Promise.all([
    getDashboardStats(),
    getAllLeads(),
    getNotifications(10),
  ]);

  const recentLeads = allLeads.slice(0, 5);

  return (
    <AppShell>
      <DashboardContent
        stats={stats}
        recentLeads={recentLeads}
        notifications={notifications}
      />
    </AppShell>
  );
}
