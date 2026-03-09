

# Plan: Template-Based IVR System + Phone Number Assignment + Extended LLM Providers + Caller ID Masking

## Approach

Instead of a complex drag-and-drop IVR builder, we use **pre-made IVR templates** that users pick from a list, then customize the labels, greeting, and phone number routing per option. Simple, fast, no visual builder needed.

## Database Changes

### New table: `ivr_menus`
- `id, business_id, name, template_type` (simple_2dept, simple_3dept, full_5dept, sales_support, medical, restaurant, custom)
- `greeting_text` (what the caller hears: "Press 1 for Sales, Press 2 for Support...")
- `greeting_audio_url` (optional custom audio)
- `timeout_seconds` (default 10)
- `max_retries` (default 2)
- `fallback_action` (agent|voicemail|transfer)
- `fallback_target, is_active, created_at`

### New table: `ivr_options`
- `id, ivr_menu_id, business_id, digit` (1-9, 0, *, #)
- `label` ("Sales", "Technical Support", "Manager", etc.)
- `action` (ai_agent|forward_to_human|voicemail|submenu|external_transfer)
- `target_phone` (forwarding number for humans)
- `agent_instructions` (custom AI prompt for this department)
- `mask_caller_id` (boolean — hide caller number from human agent)
- `record_call` (boolean)
- `is_active, priority, created_at`

### New table: `number_assignments`
- `id, phone_number_id, business_id`
- `handler_type` (ai_agent|human|ivr_menu)
- `handler_name` (display name)
- `forward_to_phone` (for human handlers)
- `ivr_menu_id` (if handler_type = ivr_menu)
- `mask_caller_id` (boolean)
- `record_calls` (boolean)
- `monitor_enabled` (boolean)
- `created_at`

### Alter `phone_numbers`
Add columns: `assigned_handler_type` (text, default 'ai_agent'), `assigned_handler_name` (text), `forward_to_phone` (text), `mask_caller_id` (boolean, default false), `record_calls` (boolean, default true), `ivr_menu_id` (uuid, nullable)

### Alter `businesses`
Add columns for extended provider support:
- `stt_provider` (text, default 'deepgram')
- `stt_model` (text, default 'nova-2')
- `endpointing_threshold_ms` (integer, default 500)
- `barge_in_enabled` (boolean, default true)
- `voicemail_detection_enabled` (boolean, default false)
- `ivr_enabled` (boolean, default false)
- `default_ivr_menu_id` (uuid, nullable)

## IVR Templates (Hardcoded in UI)

Pre-built templates users can pick with one click:

1. **Simple 2-Department** — Press 1 Sales, Press 2 Support
2. **3-Department Standard** — Press 1 Sales, Press 2 Support, Press 3 Billing
3. **Full Office (5-dept)** — Sales, Support, Billing, Manager, Operator
4. **Medical Office** — Appointments, Pharmacy, Nurse, Billing, Emergency
5. **Restaurant** — Reservations, Takeout, Catering, Manager
6. **Legal Office** — Consultation, Case Status, Billing, Reception
7. **Custom** — Start blank, add your own options

Each template pre-populates the greeting text and the digit-to-label mapping. User then edits labels, assigns phone numbers or AI agents per option, toggles caller ID masking per option.

## New UI Components

### `IvrMenuTab.tsx` (per business)
- Template gallery at top: click a card to create from template
- List of existing IVR menus below
- Edit dialog: greeting text, per-digit options table (digit, label, action type, target, mask toggle)
- Each option row: select action (AI Agent / Forward to Human / Voicemail / External Transfer), enter phone number if human, toggle mask caller ID and recording
- "Add Option" button to add more digits
- Preview card showing how the IVR greeting will sound

### Enhanced `PhoneNumbersTab.tsx`
- Add assignment controls per number: handler type dropdown (AI Agent / Human / IVR Menu)
- When Human: name field, forwarding number, mask caller ID toggle
- When IVR Menu: select which IVR menu to use
- Record calls toggle, monitoring toggle per number
- Visual indicator showing assignment status

### Enhanced `ProvidersTab.tsx`
Add these LLM providers to the selector:
- Anthropic (Claude 4, Claude 4 Sonnet, Claude 3.5)
- Ollama (local — llama3, mistral, codestral, phi-3, qwen2)
- Groq (llama3-70b, mixtral, gemma2)
- Together AI (open-source hosting)
- Mistral AI (Large, Medium, Small)
- DeepSeek (V3, Coder)
- Perplexity (pplx-70b-online)
- Azure OpenAI
- AWS Bedrock
- Cohere (Command R+)

Add STT provider section:
- Deepgram Nova-2, OpenAI Whisper, Google STT, AssemblyAI
- Endpointing threshold slider (200-2000ms)
- Barge-in toggle
- Voicemail detection toggle

## Updated `BusinessDetail.tsx`
Add "IVR Menu" tab after "Routing" tab.

## Implementation Order
1. Database migration (2 new tables + alter phone_numbers + alter businesses)
2. `IvrMenuTab.tsx` with template gallery and option editor
3. Enhanced `PhoneNumbersTab.tsx` with assignment + masking controls
4. Enhanced `ProvidersTab.tsx` with extended LLM/STT lists

