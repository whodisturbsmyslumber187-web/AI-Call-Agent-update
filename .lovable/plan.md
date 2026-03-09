

# Plan: Full Agent Control — 15 New API Actions + Telegram Bot Upgrade

## What This Does

Expands the Dashboard API with 15 new actions covering every remaining area of the platform, and upgrades the Telegram bot to bridge into the full API so you can run everything from Telegram (or any agent like OpenClaw).

## Part 1: 15 New Dashboard API Actions

Adding these to the existing `dashboard-api/index.ts`:

| # | Action | What It Does |
|---|--------|-------------|
| 1 | `create_phone_number` | Register a new phone number for a business |
| 2 | `delete_business` | Remove a business and all related data |
| 3 | `list_routing_rules` | Get call routing rules for a business |
| 4 | `create_routing_rule` | Add time/skill-based routing rule |
| 5 | `manage_dnc` | Add/remove numbers from Do Not Call list |
| 6 | `list_knowledge_base` | Get uploaded knowledge base docs |
| 7 | `update_knowledge_base` | Update the knowledge base text for a business |
| 8 | `list_sla_rules` | Get SLA rules and active violations |
| 9 | `create_sla_rule` | Create a new SLA rule |
| 10 | `list_webhooks` | List webhook endpoints |
| 11 | `create_webhook` | Register a new webhook endpoint |
| 12 | `list_experiments` | List A/B test experiments |
| 13 | `create_experiment` | Start a new A/B test with variant prompts |
| 14 | `list_customer_profiles` | Get customer profiles with lead scores |
| 15 | `manage_voicemail` | Get voicemail settings/messages |

Also add to the `API_DOCS` object so agents can self-discover all new actions via `help`.

## Part 2: Telegram Bot → Full Dashboard Bridge

Rewrite `telegram-bot/index.ts` to support all admin commands. The bot will internally call the same logic as the dashboard-api. New Telegram commands:

**Business Management:**
- `/create [name] [industry]` — Create a new business
- `/delete [name]` — Delete a business
- `/config [name]` — View agent config for a business
- `/setprompt [name] | [instructions]` — Update agent instructions
- `/setvoice [name] [voice]` — Change TTS voice
- `/setmode [name] [mode]` — Change agent mode (receptionist/sales/support)

**Contacts & Campaigns:**
- `/addcontact [biz] | [name] | [phone]` — Add a contact
- `/contacts [biz]` — List contacts count
- `/campaign [biz] | [name] | [script]` — Create a campaign
- `/startbulk [biz] [campaign]` — Start a bulk calling job
- `/startmarketing [biz] | [type] | [message]` — Start RVM/SMS job
- `/jobstatus [job_id]` — Check job progress
- `/pausejob [job_id]` — Pause a running job
- `/canceljob [job_id]` — Cancel a job

**Phone & IVR:**
- `/ivrcreate [biz] | [template]` — Create IVR from template
- `/assignnumber [number_id] [handler]` — Assign phone number

**Monitoring & Intelligence:**
- `/analytics [biz]` — Get call analytics (last 7 days)
- `/transcript [call_id]` — Get a call transcript
- `/dnc add/remove [biz] [phone]` — Manage DNC list
- `/webhooks [biz]` — List webhooks
- `/experiments [biz]` — List A/B tests
- `/profiles [biz]` — List hot customer profiles

Updated `/help` shows all commands organized by category.

## Files to Modify

1. **`supabase/functions/dashboard-api/index.ts`** — Add 15 new action handlers + update API_DOCS
2. **`supabase/functions/telegram-bot/index.ts`** — Full rewrite with 20+ admin commands bridging to database

No database changes needed — all tables already exist.

