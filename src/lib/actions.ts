"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LeadStatus, LeadTemperature } from "@/lib/types";

// ============================================
// LEAD MUTATIONS
// ============================================

type ActionResult<T = unknown> = { error: string } | ({ success: true } & T);

export async function updateLead(
  id: string,
  updates: {
    status?: LeadStatus;
    temperature?: LeadTemperature;
    assigned_to?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();

  // Validate inputs
  if (updates.notes && updates.notes.length > 5000) {
    return { error: "Notes too long (max 5000 characters)" };
  }
  if (updates.assigned_to && updates.assigned_to.length > 100) {
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
  if (settings.sending_email && settings.sending_email.length > 254) {
    return { error: "Email too long" };
  }
  if (
    (settings.email_1_subject && settings.email_1_subject.length > 200) ||
    (settings.email_2_subject && settings.email_2_subject.length > 200) ||
    (settings.email_3_subject && settings.email_3_subject.length > 200)
  ) {
    return { error: "Subject line too long" };
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

export async function importLeads(
  leads: Array<{
    full_name: string;
    first_name: string;
    email: string;
    phone?: string;
    state?: string;
    riding_goal?: string;
    inquiry_type?: "general" | "veteran";
  }>
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();

  if (leads.length === 0) return { error: "No leads to import" };
  if (leads.length > 1000) return { error: "Too many leads (max 1000 per import)" };

  const rows = leads.map((l) => ({
    full_name: l.full_name.slice(0, 200),
    first_name: l.first_name.slice(0, 100),
    email: l.email.slice(0, 254).toLowerCase(),
    phone: (l.phone || "").slice(0, 30),
    state: (l.state || "").slice(0, 100),
    riding_goal: (l.riding_goal || "").slice(0, 500),
    inquiry_type: l.inquiry_type || "general",
    source: "ad" as const,
    status: "new" as const,
    temperature: "medium" as const,
    tags: ["ad lead"],
    email_sequence_active: true,
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
    file_name: `frontend-import-${new Date().toISOString()}.csv`,
    lead_count: data?.length || 0,
    imported_by: "forrest",
  });

  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, count: data?.length || 0 };
}
