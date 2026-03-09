

# Plan: Create MCP Server Edge Function

Build an MCP server as a Supabase Edge Function using `mcp-lite` that exposes all 55+ dashboard API actions as MCP tools. Any LLM or agent (OpenClaw, Claude, GPT, etc.) can connect to it via the MCP Streamable HTTP protocol and control the entire platform programmatically.

## How It Works

The MCP server acts as a thin wrapper around the existing `dashboard-api` logic. Each API action becomes an MCP tool with a typed input schema. Authentication uses the same API key system — the agent passes its API key as a parameter or via header.

```text
Any LLM / Agent
      │
      ▼  (MCP Streamable HTTP)
┌─────────────────────┐
│  mcp-server (edge)  │
│  ─ mcp-lite + Hono  │
│  ─ 55+ MCP tools    │
└────────┬────────────┘
         │ (internal call)
         ▼
┌─────────────────────┐
│  dashboard-api      │
│  (existing logic)   │
└─────────────────────┘
```

## Implementation

### 1. New Edge Function: `supabase/functions/mcp-server/index.ts`

- Uses `mcp-lite` with Hono for HTTP transport
- Registers ~55 tools matching every dashboard API action, grouped by category:
  - **Business management**: `list_businesses`, `get_business`, `create_business`, `update_business`, `delete_business`
  - **Phone/IVR**: `list_phone_numbers`, `create_phone_number`, `create_ivr_menu`, `update_ivr_menu`, `assign_number`
  - **Contacts**: `list_contacts`, `create_contact`, `import_contacts`
  - **Campaigns/Jobs**: `list_campaigns`, `create_campaign`, `start_bulk_call`, `start_marketing_job`, `get_job_status`, `pause_job`, `cancel_job`
  - **Calls**: `list_call_logs`, `list_call_summaries`, `get_call_transcript`, `list_call_scores`, `list_call_transfers`, `list_dispositions`, `create_disposition`
  - **Config**: `get_agent_config`, `update_agent_config`, `update_providers`
  - **Routing/DNC**: `list_routing_rules`, `create_routing_rule`, `delete_routing_rule`, `manage_dnc`
  - **Knowledge Base**: `list_knowledge_base`, `create_knowledge_base_item`, `delete_knowledge_base_item`
  - **SLA/Webhooks**: `list_sla_alerts`, `create_sla_rule`, `list_webhooks`, `create_webhook`, `delete_webhook`
  - **Experiments**: `list_experiments`, `create_experiment`
  - **Customer Profiles**: `list_customer_profiles`
  - **Voicemail**: `manage_voicemail`
  - **Monitoring**: `get_dashboard_stats`, `get_analytics`
  - **Learnings**: `list_learnings`, `create_learning`, `update_learning_status`
  - **Templates**: `list_templates`, `create_template`, `update_template`, `delete_template`
  - **Segments**: `list_segments`, `create_segment`, `delete_segment`
  - **Availability**: `get_availability`, `set_availability`
  - **Capacity**: `get_inbound_capacity`, `update_inbound_capacity`
  - **Approvals**: `list_approvals`, `approve_request`, `reject_request`
  - **Queue**: `list_queue`, `clear_queue`
  - **Competitors**: `list_competitor_mentions`
- Each tool handler internally calls the dashboard-api edge function via fetch, passing the API key and action
- Includes a `help` tool that returns the full API documentation

### 2. New Deno config: `supabase/functions/mcp-server/deno.json`

```json
{
  "imports": {
    "mcp-lite": "npm:mcp-lite@^0.10.0",
    "hono": "npm:hono@^4.0.0"
  }
}
```

### 3. Update `supabase/config.toml`

Add:
```toml
[functions.mcp-server]
verify_jwt = false
```

### 4. Add MCP connection info to Help Center (`src/pages/HelpCenter.tsx`)

Add a new "MCP Server" section explaining:
- The MCP endpoint URL
- How to connect from any MCP-compatible client (Claude Desktop, OpenClaw, custom agents)
- Example config snippet for Claude Desktop / MCP Inspector
- That it requires an API key (created in Settings → API Keys)

## Files Changed
1. `supabase/functions/mcp-server/index.ts` — New MCP server edge function
2. `supabase/functions/mcp-server/deno.json` — Deno imports for mcp-lite + hono
3. `supabase/config.toml` — Register new function
4. `src/pages/HelpCenter.tsx` — MCP connection documentation

