

# Plan: Bulk Marketing Techniques — RVM, One-Ring, Bulk SMS & Phone Marketing Tools

## What We're Building

Expanding the bulk operations system with professional phone marketing techniques used in real outbound campaigns:

1. **Ringless Voicemail (RVM) Drops** — Deliver pre-recorded voicemail messages directly to a contact's voicemail box without ringing their phone. Massive reach, no disruption.
2. **One-Ring / Missed Call Callback** — Ring the contact's phone once (or twice), then hang up. The missed call prompts them to call back, where the AI agent handles them.
3. **Bulk SMS Campaigns** — Mass text message blasts with templates, variable substitution, and delivery tracking.
4. **Press-1 Campaigns (IVR Blast)** — Play a recorded message; if the contact presses 1, connect them live to the AI agent or a human.
5. **Speed-to-Lead** — Auto-dial new inbound leads within seconds of form submission or missed call.

## Database Changes

### New table: `bulk_marketing_jobs`
Unified job table for all marketing campaign types:
- `id, business_id, name, job_type (rvm|one_ring|bulk_sms|press_1|speed_to_lead), status, total_contacts, completed, failed, in_progress`
- `message_content` (text — SMS body or voicemail script)
- `audio_url` (for RVM/press-1 pre-recorded audio)
- `caller_id` (outbound caller ID to use)
- `ring_count` (for one-ring: 1 or 2 rings)
- `callback_number` (for one-ring: where callbacks route to)
- `concurrency_limit, rate_per_minute`
- `scheduled_at, started_at, completed_at, created_at`

### New table: `bulk_marketing_entries`
Per-contact entries for marketing jobs:
- `id, job_id, business_id, contact_name, contact_phone`
- `status (pending|processing|delivered|failed|callback_received|opted_out)`
- `delivery_result` (sent, voicemail_full, invalid_number, carrier_blocked, etc.)
- `callback_at` (timestamp when contact called back — for one-ring tracking)
- `sms_sid` (external SMS ID for delivery tracking)
- `attempt_count, created_at`

### Alter `bulk_call_jobs`
Add `job_type` options: keep existing but make it clear these are "live call" type jobs vs the new marketing techniques.

### New table: `sms_templates`
- `id, business_id, name, body, variables (jsonb), category (marketing|transactional|reminder), is_active, created_at`

## Edge Function: `bulk-marketing`
Handles all marketing job types via `action` + `job_type`:
- **RVM**: Marks entries as delivered (in production would call Twilio/Slybroadcast API to drop voicemails)
- **One-Ring**: Initiates single-ring calls, tracks callbacks
- **Bulk SMS**: Sends SMS messages with variable substitution (in production via Twilio SMS API)
- **Press-1**: Plays audio, tracks DTMF responses
- **Speed-to-Lead**: Auto-triggers outbound call to new lead within configurable seconds

Actions: `start`, `pause`, `cancel`, `retry_failed` (same pattern as bulk-dialer)

## New UI: `MarketingCampaignsTab.tsx`
A dedicated tab per business with:
- **Job type selector** with icons and descriptions for each technique (RVM, One-Ring, SMS, Press-1, Speed-to-Lead)
- **Create job dialog** that adapts fields based on selected type:
  - RVM: audio file upload + CSV contacts
  - One-Ring: ring count selector (1-2) + callback number + CSV contacts
  - Bulk SMS: message template editor with `{name}` `{business}` variables + CSV contacts
  - Press-1: audio file upload + transfer-to config + CSV contacts
  - Speed-to-Lead: trigger source (webhook/form) + response time SLA
- **Job list** with progress bars, delivery stats, callback tracking
- **Technique guide cards** explaining best practices for each method

## Updated `BusinessDetail.tsx`
Add new "Marketing" tab between "Bulk Calls" and "Inbound Cap" tabs.

## Updated `bulk-dialer` edge function
No changes — keep as-is for live call jobs. The new `bulk-marketing` function handles the new techniques separately.

## Config
Register `bulk-marketing` in `supabase/config.toml` with `verify_jwt = false`.

## Implementation Summary
1. Database migration: 3 new tables (`bulk_marketing_jobs`, `bulk_marketing_entries`, `sms_templates`)
2. Edge function: `bulk-marketing` with RVM/one-ring/SMS/press-1/speed-to-lead handlers
3. UI: `MarketingCampaignsTab.tsx` with type-adaptive job creation and progress tracking
4. Wire into `BusinessDetail.tsx` as new "Marketing" tab

