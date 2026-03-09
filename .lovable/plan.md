

# Plan: Per-Business Settings + Editable API Keys + God-Level Enhancements

## Part 1: Per-Business API Keys (Editable, Not One-Size-Fits-All)

The `businesses` table already has `llm_provider`, `llm_model`, `llm_api_endpoint`, `llm_api_key_name`, `tts_provider`, `tts_api_endpoint`, `tts_api_key_name` columns, and the `ProvidersTab` already lets each business configure these independently. What's missing:

**Problem**: The Settings page is static/hardcoded with no database persistence, and there's no way to add/edit/remove API key groups dynamically.

**Solution**:
1. Create a new `platform_settings` table to persist global defaults (llm_provider, llm_model, tts_provider, default_voice)
2. Create a new `api_credentials` table: `id, name, provider (twilio|livekit|vonage|openai|elevenlabs|custom), credential_key, credential_value_secret_name, is_configured, created_at` — this lets you add unlimited provider credential groups
3. Rebuild `Settings.tsx` to:
   - Load/save defaults from `platform_settings`
   - CRUD API credential groups (add new providers, edit names, delete)
   - Show which businesses are using which provider config
4. Update the `ProvidersTab` to show a dropdown of configured API credential sets so each business can pick which credentials to use

## Part 2: 15 God-Level Enhancements

### Intelligence & Automation
1. **AI Call Summarizer with Action Items** — After every call, auto-generate a summary + action items (follow-up, quote request, appointment needed) stored in `call_summaries` table. Display as cards in call logs.

2. **Smart Lead Scoring** — AI scores every caller as a lead (hot/warm/cold) based on conversation content, urgency, and intent. Add `lead_score`, `lead_status`, `lead_intent` to `customer_profiles`. Color-coded CRM view.

3. **Auto-Training Pipeline** — When an agent handles a call poorly (low score), auto-generate training suggestions. New `training_suggestions` table. "Coach" tab per business showing improvement areas.

4. **Conversation Flow Builder** — Visual drag-and-drop flow builder for call scripts. Define decision trees: "If caller asks about pricing → respond with X, then ask about timeline." Store as JSON in `conversation_flows` table. Render with a tree/flow UI.

### Operations & Scale
5. **Multi-Location Support** — Add `locations` table (address, phone, hours per location). A business like "Joe's Plumbing" can have 5 locations, each with its own phone number and availability but sharing one knowledge base.

6. **SLA & Alert System** — Define SLA rules (max wait time, max missed calls, min satisfaction score). New `sla_rules` and `sla_alerts` tables. When violated, show alert banner in Command Center and send notification.

7. **Shift Scheduling** — Define when the AI agent is active vs. when calls go to voicemail/human. New `agent_shifts` table with day/time/action. Richer than current availability_slots.

8. **Bulk Import/Export** — Import businesses, contacts, and knowledge base via CSV upload. Export call logs, analytics, CRM data as CSV/PDF.

### Customer Experience
9. **Customer Portal** — A public-facing page per business where customers can: view their upcoming reservations, request callbacks, leave feedback. New route `/portal/:businessSlug`.

10. **Post-Call Survey** — After call ends, send automated SMS survey (1-5 stars + comment). Store in `survey_responses` table. Feed into sentiment analytics.

11. **Smart Appointment Rescheduling** — When a customer calls to reschedule, agent checks availability in real-time, suggests alternatives, and updates the booking — all automated.

### Integration & Power
12. **Zapier/Make Webhook Templates** — Pre-built webhook templates with copy-paste URLs for popular automations (new booking → Google Sheet, missed call → Slack notification, new lead → CRM).

13. **White-Label Mode** — Replace "AgentHub" branding with custom logo, colors, business name. Store in `white_label_config` table. Apply via CSS variables and dynamic title.

14. **Revenue Tracking** — Track revenue per business from bookings/sales. New `revenue_entries` table. Dashboard widget showing daily/weekly/monthly revenue with forecasting chart.

15. **AI Performance Benchmarking** — Compare agent performance across businesses. Leaderboard showing: calls handled, satisfaction score, booking rate, average handle time. Gamification badges.

## Database Changes

New tables (10):
- `platform_settings` — global platform defaults
- `api_credentials` — editable API key groups
- `call_summaries` — AI-generated call summaries + action items
- `training_suggestions` — auto-generated coaching
- `conversation_flows` — visual call script flows
- `locations` — multi-location per business
- `sla_rules` + `sla_alerts` — SLA monitoring
- `agent_shifts` — shift scheduling
- `survey_responses` — post-call surveys
- `revenue_entries` — revenue tracking

Alter `customer_profiles`: add `lead_score`, `lead_status`, `lead_intent`

## New UI Components
- Rebuilt `Settings.tsx` with editable API credential CRUD
- `/portal/:slug` — customer portal (public)
- Leaderboard widget in Command Center
- Revenue chart widget
- SLA alert banner
- Conversation flow builder (tree view)
- Bulk import dialog
- Training/Coach tab per business

## Implementation Order
**Round 1** (this step): Per-business editable settings + API credentials CRUD + platform_settings persistence + 5 highest-impact enhancements (Lead Scoring, Call Summarizer, SLA Alerts, Revenue Tracking, AI Benchmarking)

**Round 2**: Conversation Flow Builder, Multi-Location, Shift Scheduling, Bulk Import, White-Label

**Round 3**: Customer Portal, Post-Call Survey, Smart Rescheduling, Zapier Templates, Auto-Training Pipeline

