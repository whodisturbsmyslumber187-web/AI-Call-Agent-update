

# Plan: Bulk Calling Engine + Telegram Control + 15 God-Level Enhancements

## Part 1: Bulk Calling & Mass Operations

### Database Changes
- New `bulk_call_jobs` table: `id, business_id, campaign_id, name, type (outbound|inbound_capacity), total_contacts, completed, failed, in_progress, concurrency_limit, calls_per_minute, status (queued|running|paused|completed|cancelled), started_at, completed_at, created_at`
- New `bulk_call_entries` table: `id, job_id, business_id, contact_name, contact_phone, status (pending|dialing|connected|completed|failed|no_answer|busy), attempt_count, max_attempts, last_attempt_at, duration_seconds, outcome, transcript_summary, created_at`
- New `inbound_capacity_config` table: `id, business_id, max_concurrent_calls, overflow_action (queue|voicemail|transfer), overflow_target, auto_scale, created_at`
- Alter `campaigns` table: add `campaign_type (manual|bulk_outbound)`, `concurrency_limit`, `calls_per_minute`, `max_retries`, `retry_delay_minutes`

### Edge Function: `bulk-dialer`
- Accepts job_id, processes entries in batches respecting concurrency_limit and calls_per_minute
- Updates entry statuses in real-time
- Retries failed/no-answer calls up to max_attempts
- Fires webhooks on job completion

### UI: Enhanced Campaigns Tab
- "Bulk Call" mode with contact CSV upload (parse name + phone)
- Concurrency slider (1-50 simultaneous calls)
- Calls-per-minute rate limiter
- Real-time progress bar with live stats (dialing/connected/completed/failed)
- Pause/Resume/Cancel controls
- Per-entry status table with retry button

### UI: Inbound Capacity Tab (per business)
- Max concurrent inbound calls setting
- Overflow rules (queue, voicemail, transfer to number)
- Auto-scale toggle

## Part 2: Telegram Bot Control

### Database Changes
- New `telegram_config` table: `id, user_id, bot_token_secret_name, chat_id, is_active, notifications (jsonb: call_completed, daily_summary, sla_alert, booking_created), created_at`
- New `telegram_commands_log` table: `id, user_id, command, response_summary, created_at`

### Edge Function: `telegram-bot`
- Webhook endpoint for Telegram Bot API
- Commands:
  - `/status` — active calls, queue, agents online
  - `/calls today` — today's call summary per business
  - `/report [business_name]` — detailed report for a business
  - `/pause [business_name]` — pause agent for a business
  - `/resume [business_name]` — resume agent
  - `/bulk start [campaign_id]` — kick off bulk calling job
  - `/bulk status [job_id]` — check bulk job progress
  - `/bookings today` — list today's reservations
  - `/leads hot` — show hot leads across all businesses
  - `/sla` — current SLA violations
- Sends proactive notifications: call completed, SLA breach, bulk job finished, daily summary

### UI: Telegram Settings (in Settings page)
- Bot token input (stored as secret)
- Chat ID configuration
- Toggle notifications per event type
- Command reference / help card
- Test connection button

## Part 3: 15 God-Level Enhancements

### 1. Power Dialer Mode
- Sequential auto-dial through a contact list — when one call ends, next starts automatically
- Agent hears brief context before each call connects
- Disposition buttons (interested/not interested/callback/wrong number) logged per call

### 2. Call Transfer & Warm Handoff
- New `call_transfers` table tracking transfers between agents/humans
- During a call, agent can warm-transfer to a human operator with context summary
- Transfer rules configurable per business

### 3. DNC (Do Not Call) Registry
- New `dnc_list` table: `id, business_id, phone_number, reason, added_at`
- Bulk calling automatically skips DNC numbers
- UI to manage DNC list with bulk import

### 4. Call Disposition & Outcome Tracking
- New `call_dispositions` table: `id, call_log_id, business_id, disposition (interested|not_interested|callback|wrong_number|dnc|no_answer|voicemail_left), notes, next_action, next_action_date, created_at`
- Dropdown in call logs to tag each call
- Analytics breakdown by disposition

### 5. Smart Retry Logic
- After failed/no-answer outbound, auto-schedule retry with configurable delays
- Time-of-day awareness (don't call at 2am)
- Max retry attempts per contact
- Escalating intervals (5min, 30min, 2hr, next day)

### 6. Real-Time Call Whisper
- New `call_whispers` table for admin-to-agent messages during live calls
- Admin can type suggestions that get injected into the AI agent's context mid-call
- "Offer them 10% discount" → agent naturally incorporates it

### 7. Contact List Segmentation
- New `contact_segments` table: `id, business_id, name, filter_criteria (jsonb), created_at`
- Filter contacts by tags, lead score, last contact date, call outcome
- Use segments to target bulk campaigns

### 8. Predictive Analytics Dashboard
- New widget in Command Center showing predicted call volume (next 7 days) based on historical patterns
- Predicted revenue forecast
- Churn risk indicators per business
- Best time-to-call analysis per contact segment

### 9. Agent Failover & Redundancy
- If primary LLM provider fails mid-call, auto-switch to backup provider
- New `provider_failover_config` table: `id, business_id, primary_provider, backup_provider, max_failures_before_switch, created_at`
- Auto-recovery when primary comes back online

### 10. Multi-Tenant White-Label API
- New `api_keys` table: `id, user_id, key_hash, name, permissions (jsonb), rate_limit, is_active, last_used_at, created_at`
- Edge function `public-api` exposing REST endpoints for external integrations
- Endpoints: list businesses, trigger bulk call, get call logs, get analytics
- API key management UI in Settings

### 11. Call Recording Transcription & Search
- After each call, auto-transcribe recording using AI
- Full-text search across all transcripts
- New `transcript_search` table with indexed content
- Search UI in Command Center: "Find all calls where customer mentioned 'competitor X'"

### 12. Geo-Routing & Local Presence
- New `local_numbers` table: `id, business_id, area_code, phone_number, region`
- When making outbound calls, auto-select a local number matching the contact's area code
- Higher answer rates with local caller ID

### 13. Campaign Analytics & ROI
- Per-campaign metrics: connection rate, avg call duration, conversion rate, cost per lead
- Compare campaigns side-by-side
- ROI calculator based on revenue attributed to campaign contacts

### 14. Batch Business Onboarding
- CSV upload to create multiple businesses at once (name, industry, phone, instructions)
- Template auto-application based on industry column
- Progress tracker showing onboarding status per business

### 15. Live Call Barge-In
- Admin can listen to any active call in real-time (listen-only mode)
- Barge-in mode: admin joins the call and speaks to both parties
- Coach mode: admin speaks only to the agent (caller can't hear)
- UI in Live Monitor: click any active call to listen/barge/coach

---

## Database Summary

New tables (9):
`bulk_call_jobs`, `bulk_call_entries`, `inbound_capacity_config`, `telegram_config`, `telegram_commands_log`, `call_transfers`, `dnc_list`, `call_dispositions`, `contact_segments`, `provider_failover_config`, `api_keys`

Alter tables (1):
`campaigns` — add `campaign_type`, `concurrency_limit`, `calls_per_minute`, `max_retries`, `retry_delay_minutes`

New edge functions (2):
`bulk-dialer`, `telegram-bot`

New UI:
- Enhanced CampaignsTab with bulk calling mode + progress tracking
- Inbound Capacity config per business
- Telegram settings section in Settings page
- DNC list management per business
- Call disposition dropdown in call logs
- Contact segmentation builder
- API key management in Settings
- Predictive analytics widget in Command Center

## Implementation Order
1. Database migration (all new tables + alter campaigns)
2. Edge functions (bulk-dialer, telegram-bot)
3. UI: Bulk calling in CampaignsTab + Inbound Capacity tab
4. UI: Telegram config in Settings
5. UI: DNC, Dispositions, Segments, API Keys, Predictive widget
6. Register edge functions in config.toml

