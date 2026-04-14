# Freedom Ryder CRM — Quick Start Guide

## How to Access

- **URL:** Check your Vercel dashboard for the production URL
- **Login:** forrest@freedomryder.com + your password
- **n8n:** https://teamfr1984.app.n8n.cloud

---

## Daily Workflow

### 1. Check Dashboard
Your home page shows:
- Total leads, new this week, active email sequences
- Ad leads, conversions, and conversion rate (ROAS)
- Recent notifications (bell icon top-right alerts you when leads reply)

### 2. Manage Pipeline
- **Search** leads by name, email, phone, or state
- **Filter** by status (New, Contacted, Replied, Qualified, Won, Lost) or temperature (Hot, Medium, Cold)
- **Click a lead** to see full details, change status, add notes, or assign to Bob

### 3. Import New Leads
- Go to Import → upload a CSV with columns: Name, Email, Phone, State
- Leads are auto-tagged as "ad leads" for ROAS tracking
- Duplicates (same email) are automatically skipped

### 4. Export Bob's Leads
- Go to Export → see all leads assigned to Bob
- Download CSV with: name, phone, email, contacted (yes/no), replied (yes/no)
- Send to Bob weekly (or let the automated weekly export handle it once activated)

---

## How the Automation Works

Everything runs through n8n (https://teamfr1984.app.n8n.cloud). You don't need to touch n8n day-to-day — it runs automatically.

### Lead Capture
Someone fills out your website form → email arrives at freedomryderusa@gmail.com with "Inquiry" in the subject → n8n captures it → lead appears in your CRM → auto-reply is sent.

### Email Sequence (3 steps)
1. **Auto-reply** — sent immediately when a new inquiry comes in
2. **Follow-up** — sent 3 days later if no reply
3. **Handoff to Bob** — sent 7 days later, assigns the lead to Bob

### Reply Detection
If a lead replies at any point, the email sequence stops automatically and you get a notification in the CRM.

### Error Alerts
If any workflow breaks, you get an email alert with details.

---

## Things You Control

### Pause/Resume Email Sequences
On any lead's detail page:
- **Pause Sequence** — stops automated emails (use when you're already talking to them directly)
- **Resume Sequence** — restarts from where it left off
- Hover the **?** icon next to "Email Sequence" for more info

### Lead Status
Update as the conversation progresses:
- **New** → just came in
- **Contacted** → you've reached out
- **Replied** → they responded
- **Qualified** → good fit, serious interest
- **Won** → sale closed
- **Lost** → not moving forward

### Temperature
- **Hot** — ready to buy
- **Medium** — interested but not urgent
- **Cold** — low priority

### Assign to Bob
Change "Assign to" → Bob on any lead. They'll appear in the Export page and Bob's weekly CSV.

---

## Action Items (One-Time Setup)

### 1. Update Email Copy (Required)
The auto-reply emails say "This is Mike" — change to your name:
1. Go to n8n → open "FR - New Inquiry → Supabase + Auto-Reply"
2. Click "Send Veteran Auto-Reply" → change "Mike" to your name → Save
3. Click "Send General Auto-Reply" → same thing → Save
4. Open "FR - Email Sequence Manager (Steps 2 & 3)"
5. Update "Mike" in Email 2 and Email 3 send nodes → Save

### 2. Website Form Routing (Required)
Your website contact form must send submissions to freedomryderusa@gmail.com with "Inquiry" in the subject line. Without this, leads won't auto-capture.

### 3. Activate Bob's Weekly Export (When Ready)
1. Open "FR - Weekly Bob Lead Export" in n8n
2. Click the Gmail send node → add Bob's email address
3. Toggle the workflow Active
4. Bob gets a CSV every Monday at 8am Pacific

### 4. Change Your Password (Optional)
Settings page → enter current password → set new one.

---

## Troubleshooting

**No new leads appearing?**
- Check that the website form sends to freedomryderusa@gmail.com with "Inquiry" in subject
- Check n8n → Executions tab → any red (failed) runs?
- Check Gmail inbox for freedomryderusa@gmail.com — are emails arriving?

**Lead got an email they shouldn't have?**
- Open the lead → click Pause Sequence immediately
- The sequence stops and no more automated emails go out

**Workflow error email?**
- Go to n8n → Executions → find the red entry → click to see what failed
- Most common: Gmail credential expired → re-authenticate in n8n Credentials

**Can't log in?**
- Contact Neil to reset your password via Supabase dashboard

---

## Architecture (For Reference)

```
Website Form → Gmail (freedomryderusa@gmail.com)
                    ↓
              n8n (automation)
              ├── Lead Capture → Supabase DB
              ├── Email Sequence → Gmail sends
              ├── Reply Detection → Supabase DB
              └── Bob Export → Gmail sends
                    ↓
              Supabase (database)
                    ↑
              Vercel (CRM frontend)
                    ↑
              Forrest's browser
```

Three systems, one database. n8n handles automation, Vercel shows the UI, Supabase stores everything.
