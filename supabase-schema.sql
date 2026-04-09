-- Freedom Ryder CRM — Supabase Schema
-- Run this in the Supabase SQL Editor after project setup

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type lead_status as enum (
  'new', 'contacted', 'replied', 'qualified', 'closed_won', 'closed_lost'
);

create type lead_temperature as enum ('hot', 'medium', 'cold');

create type lead_source as enum ('website', 'ad', 'referral', 'bob');

create type inquiry_type as enum ('general', 'veteran');

create type email_log_status as enum ('sent', 'delivered', 'opened', 'replied', 'bounced');

create type notification_type as enum ('reply', 'new_lead', 'sequence_complete', 'import');

-- ============================================
-- LEADS TABLE
-- ============================================

create table leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Contact info (with length constraints)
  full_name varchar(200) not null,
  first_name varchar(100) not null,
  email varchar(254) not null check (email ~* '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
  phone varchar(30) default '',
  state varchar(100) default '',

  -- Inquiry details
  riding_goal varchar(500) default '',
  height varchar(20) default '',
  weight varchar(20) default '',
  inquiry_type inquiry_type not null default 'general',

  -- Pipeline
  status lead_status not null default 'new',
  temperature lead_temperature not null default 'medium',
  source lead_source not null default 'website',
  assigned_to varchar(100) default '',
  notes varchar(5000) default '',
  tags text[] default '{}',

  -- Email sequence tracking
  email_sequence_active boolean not null default true,
  email_sequence_step int not null default 0,
  email_sequence_paused_at timestamptz,

  -- Timestamps
  last_contacted_at timestamptz,
  last_replied_at timestamptz
);

-- Index for pipeline queries
create index idx_leads_status on leads(status);
create index idx_leads_temperature on leads(temperature);
create index idx_leads_source on leads(source);
create index idx_leads_assigned_to on leads(assigned_to);
create index idx_leads_created_at on leads(created_at desc);
create unique index idx_leads_email_unique on leads(lower(email));

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- ============================================
-- AUDIT LOG
-- ============================================

create table lead_audit_log (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  action varchar(10) not null, -- INSERT, UPDATE, DELETE
  changed_by text default 'system',
  changed_at timestamptz not null default now(),
  old_values jsonb,
  new_values jsonb
);

create index idx_audit_lead on lead_audit_log(lead_id, changed_at desc);

create or replace function log_lead_audit()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into lead_audit_log (lead_id, action, new_values)
    values (new.id, 'INSERT', to_jsonb(new));
    return new;
  elsif (TG_OP = 'UPDATE') then
    insert into lead_audit_log (lead_id, action, old_values, new_values)
    values (new.id, 'UPDATE', to_jsonb(old), to_jsonb(new));
    return new;
  elsif (TG_OP = 'DELETE') then
    insert into lead_audit_log (lead_id, action, old_values)
    values (old.id, 'DELETE', to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger audit_lead_changes
  after insert or update or delete on leads
  for each row execute function log_lead_audit();

-- ============================================
-- EMAIL SEQUENCE LOG
-- ============================================

create table email_sequence_log (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  step int not null check (step between 1 and 3),
  sent_at timestamptz not null default now(),
  email_subject text not null,
  status email_log_status not null default 'sent',

  unique(lead_id, step)
);

create index idx_email_log_lead on email_sequence_log(lead_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  type notification_type not null,
  title varchar(200) not null,
  message varchar(1000) not null,
  read boolean not null default false,
  lead_id uuid references leads(id) on delete set null
);

create index idx_notifications_read on notifications(read, created_at desc);

-- ============================================
-- AD IMPORTS
-- ============================================

create table ad_imports (
  id uuid primary key default uuid_generate_v4(),
  imported_at timestamptz not null default now(),
  file_name text not null,
  lead_count int not null default 0,
  imported_by text not null default 'forrest'
);

-- ============================================
-- EMAIL SEQUENCE SETTINGS
-- ============================================

create table email_sequence_settings (
  id int primary key default 1 check (id = 1), -- singleton row
  email_1_delay_hours int not null default 0,      -- immediate
  email_2_delay_days int not null default 3,       -- day 3-4
  email_3_delay_days int not null default 7,       -- day 7-10 (handoff to Bob)
  email_1_subject varchar(200) not null default 'Thanks for Reaching Out!',
  email_2_subject varchar(200) not null default 'Following Up — Freedom Ryder',
  email_3_subject varchar(200) not null default 'One Last Thing — Freedom Ryder',
  sending_email varchar(254) not null default '',
  updated_at timestamptz not null default now()
);

-- Insert default settings row
insert into email_sequence_settings (id) values (1);

-- ============================================
-- VIEWS
-- ============================================

-- Bob's leads export view
create view bobs_leads_export as
select
  full_name,
  phone,
  email,
  case when last_contacted_at is not null then 'Yes' else 'No' end as contacted,
  case when last_replied_at is not null then 'Yes' else 'No' end as replied,
  status,
  temperature,
  created_at
from leads
where assigned_to = 'bob'
order by created_at desc;

-- ROAS dashboard view
create view roas_summary as
select
  count(*) filter (where source = 'ad') as ad_leads,
  count(*) filter (where source = 'ad' and status = 'closed_won') as ad_conversions,
  case
    when count(*) filter (where source = 'ad') > 0
    then round(
      (count(*) filter (where source = 'ad' and status = 'closed_won')::numeric /
       count(*) filter (where source = 'ad')::numeric) * 100, 1
    )
    else 0
  end as conversion_rate_pct
from leads;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Security model: allowlist of authorized user emails.
-- Only users in the allowed_emails list can access any data.
-- n8n uses the service_role key (bypasses RLS) for automation writes.
-- The frontend uses the anon key + user JWT (subject to RLS).
--
-- SETUP: After creating Forrest's auth account, add his email below.
-- To add users later, INSERT into allowed_crm_users.

create table allowed_crm_users (
  email text primary key
);

-- Insert authorized users
insert into allowed_crm_users (email) values ('forrest@freedomryder.com');

-- Helper function: check if current user is authorized
create or replace function is_authorized_user()
returns boolean as $$
begin
  return exists (
    select 1 from allowed_crm_users
    where email = (select auth.jwt() ->> 'email')
  );
end;
$$ language plpgsql security definer set search_path = '';

-- RLS on the allowlist table itself (only service_role can modify)
alter table allowed_crm_users enable row level security;
-- No policies = no access via anon/authenticated. Only service_role can manage.

-- LEADS
alter table leads enable row level security;

create policy "Authorized users can read leads"
  on leads for select
  to authenticated
  using (is_authorized_user());

create policy "Authorized users can insert leads"
  on leads for insert
  to authenticated
  with check (is_authorized_user());

create policy "Authorized users can update leads"
  on leads for update
  to authenticated
  using (is_authorized_user())
  with check (is_authorized_user());

create policy "Authorized users can delete leads"
  on leads for delete
  to authenticated
  using (is_authorized_user());

-- EMAIL SEQUENCE LOG
alter table email_sequence_log enable row level security;

create policy "Authorized users can read email logs"
  on email_sequence_log for select
  to authenticated
  using (is_authorized_user());

create policy "Authorized users can insert email logs"
  on email_sequence_log for insert
  to authenticated
  with check (is_authorized_user());

create policy "Authorized users can update email logs"
  on email_sequence_log for update
  to authenticated
  using (is_authorized_user())
  with check (is_authorized_user());

-- NOTIFICATIONS
alter table notifications enable row level security;

create policy "Authorized users can read notifications"
  on notifications for select
  to authenticated
  using (is_authorized_user());

create policy "Authorized users can insert notifications"
  on notifications for insert
  to authenticated
  with check (is_authorized_user());

create policy "Authorized users can update notifications"
  on notifications for update
  to authenticated
  using (is_authorized_user())
  with check (is_authorized_user());

-- AD IMPORTS
alter table ad_imports enable row level security;

create policy "Authorized users can read imports"
  on ad_imports for select
  to authenticated
  using (is_authorized_user());

create policy "Authorized users can insert imports"
  on ad_imports for insert
  to authenticated
  with check (is_authorized_user());

-- EMAIL SEQUENCE SETTINGS
alter table email_sequence_settings enable row level security;

create policy "Authorized users can read settings"
  on email_sequence_settings for select
  to authenticated
  using (is_authorized_user());

create policy "Authorized users can update settings"
  on email_sequence_settings for update
  to authenticated
  using (is_authorized_user())
  with check (is_authorized_user());

-- AUDIT LOG
alter table lead_audit_log enable row level security;

create policy "Authorized users can read audit log"
  on lead_audit_log for select
  to authenticated
  using (is_authorized_user());

-- Audit log is insert-only from triggers (runs as definer, bypasses RLS)

-- ============================================
-- NOTE ON n8n ACCESS
-- ============================================
-- n8n workflows must use the Supabase SERVICE_ROLE key (not the anon key).
-- The service_role key bypasses RLS entirely, allowing n8n to read/write
-- leads, notifications, and email logs without being an authenticated user.
-- NEVER expose the service_role key in the frontend — it is server-side only.

-- ============================================
-- SECURITY SETUP CHECKLIST
-- ============================================
-- 1. Disable public signups in Supabase Dashboard → Authentication → Settings
-- 2. Create Forrest's account manually via Dashboard → Authentication → Users
-- 3. Run: INSERT INTO allowed_crm_users (email) VALUES ('forrest@email.com');
-- 4. Generate SERVICE_ROLE key for n8n (Dashboard → Settings → API)
-- 5. Generate a strong webhook secret: openssl rand -hex 32
