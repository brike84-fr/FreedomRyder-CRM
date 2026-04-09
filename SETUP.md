# Freedom Ryder CRM — Production Setup

Step-by-step deployment guide. Follow in order. Each step has a verification check.

---

## Prerequisites

- Supabase project created (https://mdletiyedvghepeurmiq.supabase.co)
- n8n instance running (https://teamfr1984.app.n8n.cloud)
- Gmail account for sending: `freedomryderusa@gmail.com`
- GitHub repo (to push this code to)
- Vercel account (for frontend deployment)

---

## Step 1: Supabase Database Setup

**Goal:** Create all tables, RLS policies, and the allowlist.

1. Open the Supabase dashboard → **SQL Editor** → **New query**
2. Copy the entire contents of `supabase-schema.sql` and paste it
3. Click **Run**
4. Expected output: "Success. No rows returned."

**Verification:**
- Go to **Table Editor** — you should see these tables:
  - `allowed_crm_users` (1 row: `forrest@freedomryder.com`)
  - `leads`
  - `email_sequence_log`
  - `notifications`
  - `ad_imports`
  - `email_sequence_settings` (1 row with default email timing)
  - `lead_audit_log`

---

## Step 2: Supabase Auth Setup

**Goal:** Create Forrest's login account and lock down signups.

1. **Dashboard → Authentication → Providers → Email** — make sure Email provider is enabled
2. **Authentication → Sign Ups** — toggle **"Allow new users to sign up" OFF**
   - Critical: if signups are open, anyone can create an account (RLS blocks them, but defense in depth)
3. **Authentication → Users → Add user → Create new user**
   - Email: `forrest@freedomryder.com`
   - Password: (generate a strong one, give it to Forrest securely)
   - ✅ Auto-confirm email: ON

**Verification:**
- Run in SQL Editor: `SELECT email FROM auth.users;`
- Should show `forrest@freedomryder.com`
- Run: `SELECT email FROM public.allowed_crm_users;`
- Should match — both lists contain Forrest's email

---

## Step 3: n8n Gmail Setup

**Goal:** Prepare Gmail for n8n automation.

1. Log into `freedomryderusa@gmail.com`
2. Go to **Gmail Settings → Labels → Create new label**
3. Label name: `fr-auto-sent`
4. Click **Create**

**Why:** Every outgoing automated email gets this label so the reply-detection workflow can skip replies to auto-sent threads.

**Verification:**
- Label appears in left sidebar of Gmail

---

## Step 4: n8n Credentials Setup

**Goal:** Add Gmail and Supabase credentials to n8n.

1. Log into https://teamfr1984.app.n8n.cloud
2. **Credentials → New → Gmail OAuth2**
   - Click **Sign in with Google**
   - Authorize `freedomryderusa@gmail.com`
   - Save
3. **Credentials → New → Supabase**
   - Host: `https://mdletiyedvghepeurmiq.supabase.co`
   - Service Role Secret: *(copy from `n8n-workflows/CREDENTIALS.md` — the service_role key)*
   - Save

**Verification:**
- Both credentials show green "Connected" status in n8n credentials list

---

## Step 5: Import n8n Workflows

**Goal:** Import and activate all 6 workflows.

For each workflow JSON in `n8n-workflows/`:

1. **Workflows → Import from File**
2. Select the JSON
3. Click each Gmail node → assign the Gmail credential
4. Click each Supabase node → assign the Supabase credential
5. Save
6. **Toggle "Active" to ON**

**Import order** (do them in this order so dependencies are ready):

1. ✅ `FR-Lead-Capture-Supabase.json` — Gmail trigger + insert lead
2. ✅ `FR-Email-Sequence-Manager.json` — scheduled every 2 hours
3. ✅ `FR-Reply-Detection.json` — Gmail trigger for replies
4. ✅ `FR-Weekly-Bob-Export.json` — scheduled every Monday 8 AM Pacific
5. ✅ `FR-CSV-Import-Supabase.json` — webhook endpoint
6. ✅ `FR-Heartbeat-Monitor.json` — daily health check at 9 AM Pacific

**Important for the CSV Import workflow:**
- After importing, click the **Webhook node**
- Copy the **Production URL** (not the test URL)
- Save it — you'll paste it into Vercel in Step 7

**Webhook header auth for CSV Import workflow:**
- Click the Webhook node
- Authentication: **Header Auth**
- Name: `x-webhook-secret`
- Value: `af496a73cccbdf8f4a8d92e16e58790f388edbae09bfcdd7ff67a0873efe9abf`

**Verification:**
- All 6 workflows show green "Active" badge
- Webhook URL copied and saved

---

## Step 6: GitHub Repository

**Goal:** Push code to GitHub so Vercel can deploy it.

```bash
cd /path/to/crm
git remote add origin https://github.com/YOUR_USERNAME/freedom-ryder-crm.git
git push -u origin main
```

**Verification:**
- Repo visible on GitHub with all files

---

## Step 7: Vercel Deployment

**Goal:** Deploy the frontend to Vercel.

1. **Vercel → Add New → Project**
2. Import the GitHub repo
3. **Framework preset:** Next.js (auto-detected)
4. **Environment Variables** (click "Add" for each):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://mdletiyedvghepeurmiq.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(anon key from Supabase)* |
   | `N8N_WEBHOOK_SECRET` | `af496a73cccbdf8f4a8d92e16e58790f388edbae09bfcdd7ff67a0873efe9abf` |
   | `N8N_WEBHOOK_URL` | *(webhook URL from Step 5)* |

5. Click **Deploy**
6. Wait for build to finish (~2 minutes)

**Verification:**
- Visit the Vercel URL
- You should see the login page
- Log in with `forrest@freedomryder.com` and the password from Step 2
- You should land on the dashboard (empty until leads come in)

---

## Step 8: Connect the Website Form

**Goal:** Route website inquiries into the CRM.

The Lead Capture workflow watches `freedomryderusa@gmail.com` for emails matching `subject:Inquiry`. So Forrest needs to make sure his website form submissions land in that inbox with "Inquiry" in the subject.

Options depending on the form:
- **If Shopify contact form:** Change the form destination email to `freedomryderusa@gmail.com`
- **If a custom form:** Update the form action to POST to the form email service
- **If already going to Mike's email:** Forward filtered to `freedomryderusa@gmail.com`

**Verification:**
1. Submit a test inquiry through the website form
2. Wait 30 seconds
3. Check Gmail — the inquiry should appear
4. Check n8n Executions — the Lead Capture workflow should have run
5. Check the CRM dashboard — the test lead should appear
6. Check the test email inbox — the auto-reply should have arrived

---

## Step 9: Bob's Email

Add Bob's email to `FR-Weekly-Bob-Export.json`:

1. Open the workflow in n8n
2. Click the **Email CSV to Bob** node
3. Replace `<<BOB_EMAIL>>` with Bob's actual email
4. Save + re-activate

---

## Step 9.5: Dead Man's Switch (healthchecks.io)

**Why this matters:** the heartbeat monitor runs inside n8n, so if n8n dies entirely (Gmail disconnect, n8n.cloud outage, workflow deactivated by accident) the heartbeat alert dies with it. Forrest would get zero alerts. A dead man's switch runs OUTSIDE n8n and alerts Forrest **when it stops hearing from n8n**.

1. Sign up for a free account at **https://healthchecks.io**
2. Create a new check:
   - Name: `Freedom Ryder CRM Heartbeat`
   - Schedule: **Simple** → Period: `1 day`, Grace: `6 hours`
3. Copy the **Ping URL** (looks like `https://hc-ping.com/abc-123-def-456`)
4. In n8n, open the `FR - Heartbeat Monitor` workflow
5. Click the **Ping healthchecks.io** node
6. Replace `REPLACE_WITH_YOUR_UUID` with the UUID from your ping URL
7. Alternatively (better): add an environment variable `HEALTHCHECKS_PING_URL` in n8n settings
8. In healthchecks.io → **Integrations**, add an email notification to `forrest@freedomryder.com`

**Result:** every day at 9 AM Pacific, the heartbeat workflow pings healthchecks.io. If the ping doesn't arrive within 30 hours (1 day + 6 hours grace), healthchecks.io emails Forrest that the CRM has stopped checking in. This alert travels through healthchecks.io's infrastructure, completely independent of n8n and Gmail. If the entire n8n instance is down, Forrest still gets the alert.

**Verification:**
1. In n8n, manually execute the heartbeat workflow
2. Check healthchecks.io — the check should show "Up" with a recent ping time
3. To test the alert: deactivate the heartbeat workflow, wait 30 hours, and verify Forrest receives the healthchecks.io email

---

## Step 10: Test End-to-End

Run these tests in order:

### Test 1: Manual lead insert
```sql
insert into leads (full_name, first_name, email, phone, state, inquiry_type)
values ('Test User', 'Test', 'test+1@example.com', '555-0000', 'Oregon', 'general');
```
- Dashboard should show 1 lead

### Test 2: Website form → auto-reply
- Submit a form on the website
- Check auto-reply lands in test inbox
- Check Forrest is CC'd on the auto-reply
- Check email has no "Sent by n8n" footer

### Test 3: Reply detection
- Reply to the auto-reply from the test inbox
- Wait 30 seconds
- Check the lead in CRM — status should be `replied`
- Check Forrest gets a notification email

### Test 4: Sequence timing
- Wait 3-4 days on an uncontacted lead
- Verify Email 2 auto-sends

### Test 5: CSV import
- Go to `/import` in the CRM
- Upload a test CSV with 3 rows
- Verify all 3 appear in Pipeline tagged as "ad lead"

### Test 6: Bob's CSV export
- Assign a lead to Bob (lead detail → assign to Bob)
- Go to `/export`
- Click Download CSV
- Verify CSV is sanitized and contains the lead

### Test 7: Weekly Bob export
- Wait until Monday 8 AM Pacific
- Verify Bob receives the email with CSV attachment

---

## Rollback Plan

If something goes wrong:

1. **Frontend broken:** Vercel → Deployments → pick a previous deployment → Promote
2. **n8n workflow misbehaving:** Deactivate the workflow in n8n (doesn't delete data, just stops execution)
3. **Supabase data corrupted:** Restore from Supabase daily backup (Dashboard → Database → Backups)
4. **Full rollback:** Re-enable HubSpot, point form back to old destination

---

## Post-Launch Monitoring

- **Daily:** Check heartbeat monitor emails Forrest at 9 AM Pacific
- **Weekly:** Review Bob's export email to confirm it arrived
- **n8n Dashboard:** Executions tab shows success/failure rates per workflow
- **Supabase Dashboard:** Database → Logs → shows all queries, errors, and slow queries

---

## Emergency Contacts

- **Supabase issues:** dashboard → support ticket
- **n8n issues:** https://n8n.cloud support
- **Vercel issues:** dashboard → support
- **CRM bugs:** Contact SersweAI (Neil Bajaj, sersweai2@gmail.com)
