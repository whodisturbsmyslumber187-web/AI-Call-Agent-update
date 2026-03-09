

# Plan: Complete Telegram Bot & Dashboard API Coverage

## Problem
OpenClaw claims "God-Mode" control but many dashboard features have no Telegram command or API action. Several tables are completely unreachable from either interface.

## Gap Analysis

Comparing all database tables against existing Telegram commands and API actions, these features are **missing from both**:

| Feature | Table(s) | Telegram | API |
|---------|----------|----------|-----|
| Agent Learnings/Memory | `agent_learnings` | -- | -- |
| Call Scores | `call_scores` | -- | -- |
| Call Transfers | `call_transfers` | -- | -- |
| Call Dispositions | `call_dispositions` | -- | -- |
| Message Templates | `message_templates` | -- | -- |
| Contact Segments | `contact_segments` | -- | -- |
| Availability/Calendar | `availability_slots` | -- | -- |
| Inbound Capacity | `inbound_capacity_config` | -- | -- |
| Scheduled Reports | `scheduled_reports` | -- | -- |
| Competitor Mentions | `competitor_mentions` | -- | -- |
| Call Queue Mgmt | `call_queue` | count only | count only |
| Approval Requests | `approval_requests` | count only | count only |
| Revenue Records | revenue table | -- | -- |
| Provider Failover | failover config | -- | -- |

Additionally, the Telegram bot is missing commands for things the API already supports (like routing rules, knowledge base CRUD, webhook creation, experiment creation).

## Changes

### 1. Expand Dashboard API (`supabase/functions/dashboard-api/index.ts`)

Add ~20 new actions covering all missing tables:

- `list_learnings`, `create_learning`, `update_learning_status` -- agent memory
- `list_call_scores`, `get_call_score` -- call quality scores
- `list_call_transfers` -- transfer history
- `list_dispositions`, `create_disposition` -- call dispositions
- `list_templates`, `create_template`, `update_template`, `delete_template` -- message templates
- `list_segments`, `create_segment` -- contact segments
- `get_availability`, `set_availability` -- calendar availability
- `get_inbound_capacity`, `update_inbound_capacity` -- capacity config
- `list_approvals`, `approve_request`, `reject_request` -- approval management
- `list_competitor_mentions` -- competitor tracking
- `list_queue`, `clear_queue` -- call queue management
- `list_scheduled_reports`, `create_scheduled_report` -- report scheduling

Update `API_DOCS` object with all new actions and their params.

### 2. Expand Telegram Bot (`supabase/functions/telegram-bot/index.ts`)

Add ~15 new commands to match:

- `/learnings [biz]` -- view agent memory/learnings
- `/scores [biz]` -- recent call scores
- `/templates [biz]` -- message templates
- `/segments [biz]` -- contact segments
- `/capacity [biz]` -- inbound capacity status
- `/setcapacity [biz] [max]` -- update max concurrent calls
- `/approvals` -- pending approvals list
- `/approve [id]` -- approve a request
- `/reject [id]` -- reject a request
- `/queue` -- current call queue
- `/clearqueue [biz]` -- clear call queue
- `/addkb [biz] | [title] | [content]` -- add knowledge base item
- `/routing [biz]` -- list routing rules
- `/addrule [biz] | [type] | [value] | [action]` -- add routing rule
- `/competitors [biz]` -- competitor mentions

Update the `/help` response with all new commands organized by category.

### 3. Fix API Key Write Permission Check

The API currently doesn't enforce `write: false` on the API key permissions. Add a check so write operations (create, update, delete) respect the `permissions.write` flag.

### 4. Update Help Center (`src/pages/HelpCenter.tsx`)

Add all new Telegram commands and API actions to the relevant help sections so the documentation stays complete.

## Files Modified
1. `supabase/functions/dashboard-api/index.ts` -- ~20 new API actions + docs
2. `supabase/functions/telegram-bot/index.ts` -- ~15 new commands + updated /help
3. `src/pages/HelpCenter.tsx` -- updated command/API reference

