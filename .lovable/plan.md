

# Plan: Restore Settings + AgentNate Deep Integration + 10 New Features

## Problem 1: Missing LiveKit & TTS Settings

The current Settings page only has "Default Provider Preferences" and "API Credentials CRUD". The original LiveKit URL config, TTS server setup fields, and voice testing are gone. These need to be added back as dedicated sections.

**Fix:** Add two new Card sections to `Settings.tsx`:
- **LiveKit Configuration** — fields for LiveKit URL, API Key reference, API Secret reference, with a connection test button
- **TTS Server Configuration** — fields for TTS server URL, engine selection (XTTS/Fish Speech/Kokoro), voice ID, with a voice test button

These are global/platform-level defaults that individual businesses can override in their Providers tab.

## Problem 2: AgentNate Deep Integration

AgentNate is a self-hosted AI agent platform with 187 tools, XTTS/Fish Speech/Kokoro TTS, OpenAI-compatible API at port 8000, multi-panel chat, sub-agent spawning, and n8n workflow integration. We should integrate deeper than just "custom endpoint."

**New: AgentNate Connection Tab in Settings**
- Dedicated section for AgentNate server URL (default `http://localhost:8000`)
- Connection health check (hit `/docs` or `/health`)
- Auto-discover available models from AgentNate's API
- TTS engine status (which engines are loaded: XTTS, Fish Speech, Kokoro)
- Show available personas from AgentNate

## 10 New Advanced Features

### 1. Call Recording & Playback
- Add `recordings` storage bucket for call audio files
- Recording player component in Call Logs tab with waveform visualization
- Auto-upload recordings from Twilio/LiveKit webhooks

### 2. A/B Testing for Agent Scripts
- New `ab_tests` table: `id, business_id, name, variant_a_instructions, variant_b_instructions, traffic_split, winner, started_at, ended_at`
- Split incoming calls between two agent configurations
- Track conversion/satisfaction per variant
- UI tab "Experiments" per business

### 3. Real-Time Call Transcription Display
- Live transcript panel in the Live Monitor page
- WebSocket subscription to active call transcripts
- Highlight keywords, sentiment markers in real-time

### 4. Competitor Intelligence
- New `competitor_mentions` table: `id, business_id, competitor_name, call_log_id, context, created_at`
- AI extracts competitor mentions from call transcripts
- Dashboard widget showing competitor mention frequency

### 5. Custom Hold Music & Greetings
- New fields on businesses: `hold_music_url`, `greeting_audio_url`
- Upload custom audio files to storage bucket
- Audio player preview in business settings

### 6. Agent Personality Sliders
- Add personality config to businesses: `friendliness (1-10)`, `formality (1-10)`, `urgency (1-10)`, `humor (1-10)`
- Visual slider UI that translates to system prompt modifiers
- Preview personality with a test conversation

### 7. Scheduled Reports
- New `scheduled_reports` table: `id, user_id, report_type, frequency (daily|weekly|monthly), recipients, last_sent_at`
- Edge function `generate-report` that compiles analytics and sends via email
- UI in Settings to configure which reports to receive

### 8. Business Health Score
- Computed metric per business combining: call volume trend, satisfaction score, response time, booking rate, revenue growth
- Display as a single 0-100 score with color coding on the Businesses list page
- Drill-down showing contributing factors

### 9. Quick Actions / Command Palette
- Global `Cmd+K` command palette using the existing `cmdk` dependency
- Actions: jump to any business, start a call, view recent logs, create a contact, toggle agent status
- Search across businesses, contacts, call logs

### 10. Activity Timeline
- New `activity_log` table: `id, user_id, business_id, action, entity_type, entity_id, metadata, created_at`
- Auto-log all CRUD operations via database triggers
- Timeline view in sidebar or dedicated page showing recent platform activity

---

## Database Changes

New tables (4):
- `ab_tests` — A/B testing for agent scripts
- `competitor_mentions` — extracted from call transcripts
- `scheduled_reports` — report scheduling config
- `activity_log` — platform-wide activity feed

Alter `businesses`: add `hold_music_url`, `greeting_audio_url`, `personality_friendliness`, `personality_formality`, `personality_urgency`, `personality_humor` columns

New storage bucket: `recordings`

## New/Modified UI Components

- `Settings.tsx` — add LiveKit config section, TTS server section, AgentNate connection section, scheduled reports section
- `BusinessSettingsTab.tsx` — add personality sliders, hold music upload
- `BusinessDetail.tsx` — add "Experiments" tab
- `CommandPalette.tsx` — global Cmd+K component using cmdk
- `LiveMonitoring.tsx` — add live transcript panel
- `Businesses.tsx` — add health score badge per business
- New `ActivityTimeline.tsx` component

## Implementation Order

All in one pass:
1. Database migration (new tables + alter businesses)
2. Restore LiveKit + TTS sections in Settings
3. Add AgentNate connection section
4. Build Command Palette, Personality Sliders, A/B Tests tab
5. Add Activity Timeline, Health Score, Competitor mentions widget

