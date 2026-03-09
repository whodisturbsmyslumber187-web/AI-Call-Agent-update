

# Plan: Dashboard Control API + Help Center + GitHub Sync

## Part 1: Dashboard Control API Edge Function

### `supabase/functions/dashboard-api/index.ts`
A single POST endpoint authenticated via API keys from the existing `api_keys` table.

**Auth flow**: Extract `Bearer ak_xxxxx` from header → SHA-256 hash → lookup in `api_keys` → check `is_active` + rate limit.

**Actions supported** (via `action` field in JSON body):

| Category | Actions |
|----------|---------|
| Businesses | `list_businesses`, `get_business`, `create_business`, `update_business` |
| Phone/IVR | `list_phone_numbers`, `create_ivr_menu`, `update_ivr_menu`, `assign_number` |
| Contacts | `list_contacts`, `create_contact`, `import_contacts` |
| Campaigns | `list_campaigns`, `create_campaign`, `start_bulk_call`, `start_marketing_job`, `get_job_status`, `pause_job`, `cancel_job` |
| Calls | `list_call_logs`, `list_call_summaries`, `get_call_transcript` |
| Config | `get_agent_config`, `update_agent_config`, `list_providers`, `update_providers` |
| Monitoring | `get_dashboard_stats`, `list_active_calls`, `get_analytics` |
| Help | `help` — returns full API documentation as JSON for agent self-discovery |

Each action handler queries/mutates via Supabase service role. Returns structured JSON with `success`, `data`, and `error` fields.

### Config
Register `dashboard-api` in `supabase/config.toml` with `verify_jwt = false`.

---

## Part 2: Help & Documentation Center

### New page: `src/pages/HelpCenter.tsx`
Accordion-based documentation page covering all 23+ sections of the platform. Each section contains:
- What it does (plain English)
- How to use it (step-by-step)
- Tips and best practices
- Corresponding API actions (so external agents know which `dashboard-api` action to call)

**Sections**: Getting Started, Businesses, Agent Config, IVR Phone Trees, Phone Numbers & Masking, Contacts & Segments, Campaigns & Bulk Calling, Marketing Techniques (RVM/SMS/One-Ring/Press-1), Knowledge Base, Call Logs & Summaries, Routing Rules, SLA Rules, Voicemail, Webhooks, Experiments, Command Center, Agent Hub, Live Monitoring, API Keys & Dashboard API, Provider Failover, DNC List, Revenue Tracking, Telegram Bot.

### Sidebar + Router updates
- Add `HelpCircle` icon nav item to `Sidebar.tsx` between Activity and Settings
- Add `/help` route to `App.tsx`

---

## Part 3: GitHub Sync

Lovable automatically pushes all changes to the connected GitHub repository. After implementation, all new files and edits will be committed and synced to GitHub automatically — no manual step needed.

---

## Files to create/modify
1. **Create** `supabase/functions/dashboard-api/index.ts` — full API controller
2. **Create** `src/pages/HelpCenter.tsx` — documentation page
3. **Edit** `supabase/config.toml` — register dashboard-api
4. **Edit** `src/components/Sidebar.tsx` — add Help nav item
5. **Edit** `src/App.tsx` — add /help route

