"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockLeads } from "@/lib/mock-data";
import { Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export function ExportContent() {
  const [exported, setExported] = useState(false);

  const bobsLeads = mockLeads.filter((l) => l.assigned_to === "bob");

  const handleExport = () => {
    // Build CSV
    const headers = ["Full Name", "Phone", "Email", "Contacted", "Replied", "Status", "Temperature", "Added"];
    const csvRows = bobsLeads.map((l) => [
      l.full_name,
      l.phone,
      l.email,
      l.last_contacted_at ? "Yes" : "No",
      l.last_replied_at ? "Yes" : "No",
      l.status,
      l.temperature,
      new Date(l.created_at).toLocaleDateString(),
    ]);

    const sanitize = (v: string) => {
      if (/^[=+\-@\t\r]/.test(v)) return "'" + v;
      return v;
    };
    const csv = [headers, ...csvRows].map((r) => r.map((v) => `"${sanitize(v)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bobs-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">Export</h1>
        <p className="text-ink-muted text-sm mt-1">
          Generate Bob&apos;s weekly lead export — name, phone, email, contacted &amp; replied status.
        </p>
      </div>

      {/* Preview */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Bob&apos;s Leads — {bobsLeads.length} total
          </CardTitle>
          <Badge className="bg-sage-light text-forest text-xs border-0">
            assigned_to: bob
          </Badge>
        </CardHeader>
        <CardContent>
          {bobsLeads.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contacted</TableHead>
                    <TableHead>Replied</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bobsLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-sm">{lead.full_name}</TableCell>
                      <TableCell className="text-sm">{lead.phone}</TableCell>
                      <TableCell className="text-sm">{lead.email}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${lead.last_contacted_at ? "bg-forest-light text-forest" : "bg-stone-light text-ink-muted"}`}>
                          {lead.last_contacted_at ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${lead.last_replied_at ? "bg-forest-light text-forest" : "bg-stone-light text-ink-muted"}`}>
                          {lead.last_replied_at ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{lead.status.replace("_", " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={handleExport} className="bg-forest text-cream hover:bg-forest-deep">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                {exported && (
                  <span className="flex items-center gap-1.5 text-sm text-forest">
                    <CheckCircle2 className="w-4 h-4" /> Downloaded
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted py-8 text-center">
              No leads assigned to Bob yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
