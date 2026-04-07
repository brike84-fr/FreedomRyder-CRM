"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockLeads, mockStats, mockNotifications } from "@/lib/mock-data";
import {
  Users,
  UserPlus,
  Mail,
  Megaphone,
  Trophy,
  TrendingUp,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  qualified: "Qualified",
  closed_won: "Won",
  closed_lost: "Lost",
};

const statusColors: Record<string, string> = {
  new: "bg-amber-light text-amber",
  contacted: "bg-sage-light text-forest",
  replied: "bg-forest-light text-forest-deep",
  qualified: "bg-forest text-cream",
  closed_won: "bg-forest-deep text-cream",
  closed_lost: "bg-stone-light text-ink-muted",
};

const tempColors: Record<string, string> = {
  hot: "bg-rust-light text-rust",
  medium: "bg-amber-light text-amber",
  cold: "bg-stone-light text-ink-muted",
};

export function DashboardContent() {
  const recentLeads = [...mockLeads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentNotifications = mockNotifications.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">
          Dashboard
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Overview of your lead pipeline and performance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Total Leads"
          value={mockStats.total_leads}
        />
        <StatCard
          icon={<UserPlus className="w-4 h-4" />}
          label="New This Week"
          value={mockStats.new_leads_this_week}
          accent
        />
        <StatCard
          icon={<Mail className="w-4 h-4" />}
          label="Active Sequences"
          value={mockStats.active_sequences}
        />
        <StatCard
          icon={<Megaphone className="w-4 h-4" />}
          label="Ad Leads"
          value={mockStats.ad_leads}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="Conversions"
          value={mockStats.conversions}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Conv. Rate"
          value={`${mockStats.roas_ratio}%`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline breakdown */}
        <Card className="lg:col-span-1 bg-warm-white border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(mockStats.leads_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs border-0 ${statusColors[status]}`}
                  >
                    {statusLabels[status]}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-ink">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent leads */}
        <Card className="lg:col-span-2 bg-warm-white border-border shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">
              Recent Leads
            </CardTitle>
            <Link
              href="/pipeline"
              className="text-xs text-forest font-medium hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/pipeline/${lead.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-cream/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center text-xs font-semibold text-forest-deep">
                      {lead.first_name[0]}
                      {lead.full_name.split(" ")[1]?.[0] || ""}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {lead.full_name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {lead.state} &middot; {lead.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border-0 ${tempColors[lead.temperature]}`}>
                      {lead.temperature}
                    </Badge>
                    <Badge className={`text-xs border-0 ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROAS + Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ROAS */}
        <Card className="bg-warm-white border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">
              Ad Performance (ROAS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-cream rounded-lg">
                <p className="font-[var(--font-heading)] text-3xl text-ink">
                  {mockStats.ad_leads}
                </p>
                <p className="text-xs text-ink-muted mt-1">Ad Leads</p>
              </div>
              <div className="text-center p-4 bg-cream rounded-lg">
                <p className="font-[var(--font-heading)] text-3xl text-forest">
                  {mockStats.conversions}
                </p>
                <p className="text-xs text-ink-muted mt-1">Conversions</p>
              </div>
              <div className="text-center p-4 bg-cream rounded-lg">
                <p className="font-[var(--font-heading)] text-3xl text-rust">
                  {mockStats.roas_ratio}%
                </p>
                <p className="text-xs text-ink-muted mt-1">Conv. Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-warm-white border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 py-2 px-3 rounded-lg ${
                  !notif.read ? "bg-forest-light/50" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    !notif.read ? "bg-forest" : "bg-stone"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-ink">{notif.title}</p>
                  <p className="text-xs text-ink-muted">{notif.message}</p>
                  <p className="text-xs text-ink-muted/60 mt-0.5">
                    {formatDateTime(notif.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className={`shadow-none border-border ${accent ? "bg-forest-light" : "bg-warm-white"}`}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-ink-muted mb-2">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="font-[var(--font-heading)] text-2xl text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
