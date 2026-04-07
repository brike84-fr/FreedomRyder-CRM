export type LeadStatus = "new" | "contacted" | "replied" | "qualified" | "closed_won" | "closed_lost";
export type LeadTemperature = "hot" | "medium" | "cold";
export type LeadSource = "website" | "ad" | "referral" | "bob";

export interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  first_name: string;
  email: string;
  phone: string;
  state: string;
  riding_goal: string;
  height: string;
  weight: string;
  inquiry_type: "general" | "veteran";
  status: LeadStatus;
  temperature: LeadTemperature;
  source: LeadSource;
  assigned_to: "forrest" | "bob" | "";
  notes: string;
  tags: string[];
  email_sequence_active: boolean;
  email_sequence_step: number; // 0 = not started, 1-3 = which email sent
  email_sequence_paused_at: string | null;
  last_contacted_at: string | null;
  last_replied_at: string | null;
}

export interface EmailSequenceLog {
  id: string;
  lead_id: string;
  step: number; // 1, 2, or 3
  sent_at: string;
  email_subject: string;
  status: "sent" | "delivered" | "opened" | "replied" | "bounced";
}

export interface Notification {
  id: string;
  created_at: string;
  type: "reply" | "new_lead" | "sequence_complete" | "import";
  title: string;
  message: string;
  read: boolean;
  lead_id: string | null;
}

export interface AdImport {
  id: string;
  imported_at: string;
  file_name: string;
  lead_count: number;
  imported_by: string;
}

export interface DashboardStats {
  total_leads: number;
  new_leads_this_week: number;
  active_sequences: number;
  ad_leads: number;
  conversions: number;
  roas_ratio: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_temperature: Record<LeadTemperature, number>;
}
