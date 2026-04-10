"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLead, pauseLeadSequence, resumeLeadSequence } from "@/lib/actions";
import type { Lead, EmailSequenceLog, LeadStatus, LeadTemperature } from "@/lib/types";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Target,
  Ruler,
  Weight,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatDateTime } from "@/lib/format-date";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  qualified: "Qualified",
  closed_won: "Won",
  closed_lost: "Lost",
};

const statusColors: Record<LeadStatus, string> = {
  new: "bg-amber-light text-amber",
  contacted: "bg-sage-light text-forest",
  replied: "bg-forest-light text-forest-deep",
  qualified: "bg-forest text-cream",
  closed_won: "bg-forest-deep text-cream",
  closed_lost: "bg-stone-light text-ink-muted",
};

const tempColors: Record<LeadTemperature, string> = {
  hot: "bg-rust-light text-rust",
  medium: "bg-amber-light text-amber",
  cold: "bg-stone-light text-ink-muted",
};

const emailStepLabels = [
  "",
  "Auto-reply (immediate)",
  "Follow-up (day 3–4)",
  "Handoff to Bob (day 7–10)",
];

const emailStepTooltips = [
  "",
  "Sent automatically when a new inquiry comes in",
  "Follow-up email sent a few days later if no reply",
  "Final email that hands the lead off to Bob for a personal call",
];

const emailLogStatusIcons: Record<string, React.ReactNode> = {
  sent: <Send className="w-3.5 h-3.5 text-ink-muted" />,
  delivered: <CheckCircle2 className="w-3.5 h-3.5 text-sage" />,
  opened: <Mail className="w-3.5 h-3.5 text-forest" />,
  replied: <Mail className="w-3.5 h-3.5 text-rust" />,
  bounced: <Mail className="w-3.5 h-3.5 text-red-500" />,
};

interface LeadDetailContentProps {
  leadId: string;
  lead: Lead | null;
  emailLogs: EmailSequenceLog[];
}

export function LeadDetailContent({ leadId, lead, emailLogs }: LeadDetailContentProps) {
  const [status, setStatus] = useState<LeadStatus>(lead?.status || "new");
  const [temperature, setTemperature] = useState<LeadTemperature>(lead?.temperature || "medium");
  const [assignedTo, setAssignedTo] = useState(lead?.assigned_to || "");
  const [notes, setNotes] = useState(lead?.notes || "");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const handleSaveChanges = async () => {
    setSaving(true);
    const result = await updateLead(leadId, {
      status,
      temperature,
      assigned_to: assignedTo === "unassigned" ? "" : assignedTo,
    });
    setSaving(false);
    if ("error" in result) {
      setSavedMessage(result.error);
    } else {
      setSavedMessage("Saved");
      setTimeout(() => setSavedMessage(""), 2000);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const result = await updateLead(leadId, { notes });
    setSaving(false);
    if ("error" in result) {
      setSavedMessage(result.error);
    } else {
      setSavedMessage("Notes saved");
      setTimeout(() => setSavedMessage(""), 2000);
    }
  };

  const handlePauseSequence = async () => {
    setSaving(true);
    const result = await pauseLeadSequence(leadId);
    setSaving(false);
    if ("error" in result) {
      setSavedMessage(result.error);
    } else {
      setSavedMessage("Sequence paused");
    }
    setTimeout(() => setSavedMessage(""), 2000);
  };

  const handleResumeSequence = async () => {
    setSaving(true);
    const result = await resumeLeadSequence(leadId);
    setSaving(false);
    if ("error" in result) {
      setSavedMessage(result.error);
    } else {
      setSavedMessage("Sequence resumed");
    }
    setTimeout(() => setSavedMessage(""), 2000);
  };

  if (!lead) {
    return (
      <div className="space-y-4">
        <Link href="/pipeline" className="flex items-center gap-2 text-sm text-forest hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>
        <p className="text-ink-muted">Lead not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <Link href="/pipeline" className="flex items-center gap-2 text-sm text-forest hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-forest-light flex items-center justify-center text-lg font-semibold text-forest-deep">
            {lead.first_name?.[0] || ""}{lead.full_name.split(" ")[1]?.[0] || ""}
          </div>
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl text-ink">{lead.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs border-0 ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge>
              <Badge className={`text-xs border-0 ${statusColors[lead.status]}`}>{statusLabels[lead.status]}</Badge>
              {lead.inquiry_type === "veteran" && (
                <Badge className="text-xs border-0 bg-forest-light text-forest-deep">Veteran</Badge>
              )}
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact info + details */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-warm-white border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone || "—"} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="State" value={lead.state || "—"} />
              <InfoRow icon={<Target className="w-4 h-4" />} label="Goal" value={lead.riding_goal || "—"} />
              <InfoRow icon={<Ruler className="w-4 h-4" />} label="Height" value={lead.height || "—"} />
              <InfoRow icon={<Weight className="w-4 h-4" />} label="Weight" value={lead.weight || "—"} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Added" value={formatDate(lead.created_at)} />
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="bg-warm-white border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                  <SelectTrigger className="bg-cream border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Temperature</label>
                <Select value={temperature} onValueChange={(v) => setTemperature(v as LeadTemperature)}>
                  <SelectTrigger className="bg-cream border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Assign to</label>
                <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v || "")}>
                  <SelectTrigger className="bg-cream border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="forrest">Forrest</SelectItem>
                    <SelectItem value="bob">Bob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full bg-forest text-cream hover:bg-forest-deep mt-2"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {savedMessage && (
                <p className="text-xs text-forest text-center mt-1">{savedMessage}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email sequence + notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Email sequence */}
          <Card className="bg-warm-white border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Sequence
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    3-step automated email drip: auto-reply, follow-up, then handoff to Bob. Runs automatically via n8n — pause it if you&apos;re already talking to this lead directly.
                  </TooltipContent>
                </Tooltip>
                {lead.email_sequence_active && (
                  <Badge className="bg-forest text-cream text-xs border-0 ml-2">Active</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sequence steps visual */}
              <div className="flex items-center gap-3 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          lead.email_sequence_step >= step ? "bg-forest text-cream" : "bg-stone-light text-ink-muted"
                        }`}>
                          {step}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{emailStepTooltips[step]}</TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-ink-muted hidden sm:inline">{emailStepLabels[step]}</span>
                    {step < 3 && <div className={`w-8 h-px ${lead.email_sequence_step > step ? "bg-forest" : "bg-stone"}`} />}
                  </div>
                ))}
              </div>

              {/* Email log */}
              {emailLogs.length > 0 ? (
                <div className="space-y-3">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 py-2 px-3 bg-cream rounded-lg">
                      {emailLogStatusIcons[log.status]}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{log.email_subject}</p>
                        <p className="text-xs text-ink-muted">
                          Step {log.step} &middot; {log.status} &middot;{" "}
                          {formatDateTime(log.sent_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No emails sent yet.</p>
              )}

              {lead.email_sequence_active ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="outline"
                      onClick={handlePauseSequence}
                      disabled={saving}
                      className="mt-4 border-rust text-rust hover:bg-rust-light"
                    >
                      Pause Sequence
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">
                    Stop automated emails for this lead. Use this when you&apos;re already in contact with them directly.
                  </TooltipContent>
                </Tooltip>
              ) : lead.email_sequence_step < 3 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="outline"
                      onClick={handleResumeSequence}
                      disabled={saving}
                      className="mt-4 border-forest text-forest hover:bg-forest-light"
                    >
                      Resume Sequence
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">
                    Restart automated emails from where they left off.
                  </TooltipContent>
                </Tooltip>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-warm-white border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 5000))}
                rows={4}
                className="bg-cream border-border resize-none"
                placeholder="Add notes about this lead..."
                maxLength={5000}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={saving}
                className="mt-3 bg-forest text-cream hover:bg-forest-deep"
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-warm-white border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lead.last_replied_at && (
                  <TimelineItem
                    icon={<Mail className="w-3.5 h-3.5 text-rust" />}
                    text="Lead replied"
                    date={lead.last_replied_at}
                  />
                )}
                {lead.last_contacted_at && (
                  <TimelineItem
                    icon={<Send className="w-3.5 h-3.5 text-forest" />}
                    text="Last contacted"
                    date={lead.last_contacted_at}
                  />
                )}
                <TimelineItem
                  icon={<Clock className="w-3.5 h-3.5 text-ink-muted" />}
                  text="Lead created"
                  date={lead.created_at}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-ink-muted">{icon}</span>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm text-ink">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ icon, text, date }: { icon: React.ReactNode; text: string; date: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-cream rounded-lg">
      {icon}
      <div className="flex-1">
        <p className="text-sm text-ink">{text}</p>
      </div>
      <span className="text-xs text-ink-muted">
        {formatDateTime(date)}
      </span>
    </div>
  );
}
