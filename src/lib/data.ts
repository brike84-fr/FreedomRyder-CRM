import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  EmailSequenceLog,
  Notification,
  DashboardStats,
  LeadStatus,
  LeadTemperature,
} from "@/lib/types";

// ============================================
// LEADS
// ============================================

export async function getAllLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllLeads error:", error);
    return [];
  }
  return (data || []) as Lead[];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") console.error("getLeadById error:", error);
    return null;
  }
  return data as Lead;
}

export async function getBobsLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", "bob")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBobsLeads error:", error);
    return [];
  }
  return (data || []) as Lead[];
}

// ============================================
// EMAIL SEQUENCE LOGS
// ============================================

export async function getEmailLogsForLead(
  leadId: string
): Promise<EmailSequenceLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_sequence_log")
    .select("*")
    .eq("lead_id", leadId)
    .order("sent_at", { ascending: true });

  if (error) {
    console.error("getEmailLogsForLead error:", error);
    return [];
  }
  return (data || []) as EmailSequenceLog[];
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getNotifications error:", error);
    return [];
  }
  return (data || []) as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) {
    console.error("getUnreadNotificationCount error:", error);
    return 0;
  }
  return count || 0;
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const { data: leads, error } = await supabase.from("leads").select("*");

  if (error || !leads) {
    console.error("getDashboardStats error:", error);
    return emptyStats();
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  const statusCounts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    replied: 0,
    qualified: 0,
    closed_won: 0,
    closed_lost: 0,
  };
  const tempCounts: Record<LeadTemperature, number> = {
    hot: 0,
    medium: 0,
    cold: 0,
  };

  let newThisWeek = 0;
  let activeSequences = 0;
  let adLeads = 0;
  let conversions = 0;

  for (const lead of leads) {
    statusCounts[lead.status as LeadStatus] =
      (statusCounts[lead.status as LeadStatus] || 0) + 1;
    tempCounts[lead.temperature as LeadTemperature] =
      (tempCounts[lead.temperature as LeadTemperature] || 0) + 1;

    if (lead.created_at >= weekAgoISO) newThisWeek++;
    if (lead.email_sequence_active) activeSequences++;
    if (lead.source === "ad") {
      adLeads++;
      if (lead.status === "closed_won") conversions++;
    }
  }

  const roasRatio = adLeads > 0 ? Math.round((conversions / adLeads) * 100) : 0;

  return {
    total_leads: leads.length,
    new_leads_this_week: newThisWeek,
    active_sequences: activeSequences,
    ad_leads: adLeads,
    conversions,
    roas_ratio: roasRatio,
    leads_by_status: statusCounts,
    leads_by_temperature: tempCounts,
  };
}

function emptyStats(): DashboardStats {
  return {
    total_leads: 0,
    new_leads_this_week: 0,
    active_sequences: 0,
    ad_leads: 0,
    conversions: 0,
    roas_ratio: 0,
    leads_by_status: {
      new: 0,
      contacted: 0,
      replied: 0,
      qualified: 0,
      closed_won: 0,
      closed_lost: 0,
    },
    leads_by_temperature: { hot: 0, medium: 0, cold: 0 },
  };
}

// ============================================
// EMAIL SEQUENCE SETTINGS
// ============================================

export interface EmailSequenceSettings {
  id: number;
  email_1_delay_hours: number;
  email_2_delay_days: number;
  email_3_delay_days: number;
  email_1_subject: string;
  email_2_subject: string;
  email_3_subject: string;
  sending_email: string;
  updated_at: string;
}

export async function getSettings(): Promise<EmailSequenceSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_sequence_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("getSettings error:", error);
    return null;
  }
  return data as EmailSequenceSettings;
}
