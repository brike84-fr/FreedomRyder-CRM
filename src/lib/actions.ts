"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LeadStatus, LeadTemperature } from "@/lib/types";

// ============================================
// LEAD MUTATIONS
// ============================================

type ActionResult<T = unknown> = { error: string } | ({ success: true } & T);

const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "replied", "qualified", "closed_won", "closed_lost"];
const VALID_TEMPERATURES: LeadTemperature[] = ["hot", "medium", "cold"];
const VALID_ASSIGNEES = ["", "forrest", "bob"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateLead(
  id: string,
  updates: {
    status?: LeadStatus;
    temperature?: LeadTemperature;
    assigned_to?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  if (!id) return { error: "Missing lead ID" };
  const supabase = await createClient();

  // Validate inputs
  if (updates.notes && updates.notes.length > 5000) {
    return { error: "Notes too long (max 5000 characters)" };
  }
  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    return { error: "Invalid status" };
  }
  if (updates.temperature && !VALID_TEMPERATURES.includes(updates.temperature)) {
    return { error: "Invalid temperature" };
  }
  if (updates.assigned_to !== undefined && !VALID_ASSIGNEES.includes(updates.assigned_to)) {
    return { error: "Invalid assignee" };
  }

  const { error } = await supabase.from("leads").update(updates).eq("id", id);

  if (error) {
    console.error("updateLead error:", error);
    return { error: "Failed to update lead" };
  }

  revalidatePath(`/pipeline/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true };
}

export async function pauseLeadSequence(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      email_sequence_active: false,
      email_sequence_paused_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("pauseLeadSequence error:", error);
    return { error: "Failed to pause sequence" };
  }

  revalidatePath(`/pipeline/${id}`);
  return { success: true };
}

export async function resumeLeadSequence(id: string): Promise<ActionResult> {
  if (!id) return { error: "Missing lead ID" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      email_sequence_active: true,
      email_sequence_paused_at: null,
    })
    .eq("id", id);

  if (error) {
    console.error("resumeLeadSequence error:", error);
    return { error: "Failed to resume sequence" };
  }

  revalidatePath(`/pipeline/${id}`);
  return { success: true };
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) {
    console.error("markNotificationRead error:", error);
    return { error: "Failed to mark notification read" };
  }

  revalidatePath("/");
  return { success: true };
}

// ============================================
// SETTINGS MUTATIONS
// ============================================

export async function updateSettings(settings: {
  sending_email?: string;
  email_1_delay_hours?: number;
  email_2_delay_days?: number;
  email_3_delay_days?: number;
  email_1_subject?: string;
  email_2_subject?: string;
  email_3_subject?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  // Validate
  if (settings.sending_email !== undefined) {
    if (settings.sending_email.length > 254) return { error: "Email too long" };
    if (settings.sending_email && !EMAIL_REGEX.test(settings.sending_email)) {
      return { error: "Invalid email format" };
    }
  }
  if (
    (settings.email_1_subject && settings.email_1_subject.length > 200) ||
    (settings.email_2_subject && settings.email_2_subject.length > 200) ||
    (settings.email_3_subject && settings.email_3_subject.length > 200)
  ) {
    return { error: "Subject line too long" };
  }
  if (settings.email_1_delay_hours !== undefined && (settings.email_1_delay_hours < 0 || settings.email_1_delay_hours > 720)) {
    return { error: "Email 1 delay must be 0–720 hours" };
  }
  if (settings.email_2_delay_days !== undefined && (settings.email_2_delay_days < 1 || settings.email_2_delay_days > 90)) {
    return { error: "Email 2 delay must be 1–90 days" };
  }
  if (settings.email_3_delay_days !== undefined && (settings.email_3_delay_days < 1 || settings.email_3_delay_days > 90)) {
    return { error: "Email 3 delay must be 1–90 days" };
  }

  const { error } = await supabase
    .from("email_sequence_settings")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    console.error("updateSettings error:", error);
    return { error: "Failed to update settings" };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ============================================
// LEAD IMPORT
// ============================================

// Map HubSpot lead status text to our lead_status enum
function mapHubspotStatus(
  status: string | undefined
): "new" | "contacted" | "replied" | "qualified" | "closed_won" | "closed_lost" {
  if (!status) return "new";
  const s = status.toLowerCase().trim();
  // Exact matches first
  if (s === "customer" || s === "closed won" || s === "won") return "closed_won";
  if (s === "unqualified" || s === "closed lost" || s === "lost") return "closed_lost";
  if (s === "qualified" || s === "opportunity") return "qualified";
  if (s === "replied" || s === "engaged") return "replied";
  if (s === "contacted" || s === "in progress" || s === "attempted") return "contacted";
  // Loose matches (closed_lost before closed_won to avoid "unqualified" → won)
  if (s.includes("closed lost") || s.includes("unqualified") || s.includes("lost")) return "closed_lost";
  if (s.includes("closed won") || s === "customer") return "closed_won";
  if (s.includes("qualified")) return "qualified";
  if (s.includes("replied") || s.includes("engaged")) return "replied";
  if (s.includes("contacted")) return "contacted";
  return "new";
}

export async function importLeads(
  leads: Array<{
    full_name: string;
    first_name: string;
    email: string;
    phone?: string;
    state?: string;
    riding_goal?: string;
    inquiry_type?: "general" | "veteran";
    notes?: string;
    hubspot_status?: string;
  }>,
  sourceType: "hubspot" | "ad" | "generic" = "ad"
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();

  if (leads.length === 0) return { error: "No leads to import" };
  if (leads.length > 1000) return { error: "Too many leads (max 1000 per import)" };

  // HubSpot imports: real CRM data, don't tag as ad, don't start email sequence
  // Ad/Generic imports: new leads from ad platforms, tag + sequence
  const isHubspot = sourceType === "hubspot";

  // Server-side email validation — filter out invalid emails
  const validLeads = leads.filter((l) => l.email && EMAIL_REGEX.test(l.email.trim()));
  if (validLeads.length === 0) return { error: "No leads with valid email addresses" };

  const rows = validLeads.map((l) => ({
    full_name: l.full_name.slice(0, 200),
    first_name: l.first_name.slice(0, 100),
    email: l.email.slice(0, 254).toLowerCase(),
    phone: (l.phone || "").slice(0, 30),
    state: (l.state || "").slice(0, 100),
    riding_goal: (l.riding_goal || "").slice(0, 500),
    notes: (l.notes || "").slice(0, 5000),
    inquiry_type: l.inquiry_type === "veteran" ? "veteran" as const : "general" as const,
    source: isHubspot ? ("referral" as const) : ("ad" as const),
    status: isHubspot ? mapHubspotStatus(l.hubspot_status) : ("new" as const),
    temperature: "medium" as const,
    tags: isHubspot ? ["hubspot import"] : ["ad lead"],
    // HubSpot imports are existing contacts, don't restart the email sequence
    email_sequence_active: !isHubspot,
    email_sequence_step: 0,
  }));

  const { data, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("importLeads error:", error);
    return { error: "Import failed" };
  }

  // Log import
  await supabase.from("ad_imports").insert({
    file_name: `${sourceType}-import-${new Date().toISOString()}.csv`,
    lead_count: data?.length || 0,
    imported_by: "forrest",
  });

  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, count: data?.length || 0 };
}
