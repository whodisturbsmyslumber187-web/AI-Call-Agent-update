import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// ── Helper: call dashboard-api internally ──
async function callDashboardApi(apiKey: string, action: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/dashboard-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ action, ...params }),
  });
  return await res.json();
}

// ── Tool definitions ──
// Each tool maps 1:1 to a dashboard-api action.
// The handler extracts api_key from params, then forwards to dashboard-api.

interface ToolDef {
  name: string;
  description: string;
  properties: Record<string, { type: string; description: string }>;
  required: string[];
}

const toolDefs: ToolDef[] = [
  // ── Businesses ──
  { name: "list_businesses", description: "List all your businesses.", properties: { api_key: { type: "string", description: "Your API key" } }, required: ["api_key"] },
  { name: "get_business", description: "Get a single business by ID.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_business", description: "Create a new business.", properties: { api_key: { type: "string", description: "Your API key" }, name: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry (optional)" }, instructions: { type: "string", description: "Agent instructions (optional)" } }, required: ["api_key", "name"] },
  { name: "update_business", description: "Update business fields.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, updates: { type: "string", description: "JSON object of fields to update" } }, required: ["api_key", "business_id", "updates"] },
  { name: "delete_business", description: "Delete a business and all related data.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },

  // ── Phone / IVR ──
  { name: "list_phone_numbers", description: "List phone numbers for a business.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_phone_number", description: "Register a new phone number.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, phone_number: { type: "string", description: "Phone number" }, provider: { type: "string", description: "Provider (optional)" }, direction: { type: "string", description: "inbound|outbound|both" }, label: { type: "string", description: "Label (optional)" } }, required: ["api_key", "business_id", "phone_number"] },
  { name: "create_ivr_menu", description: "Create an IVR menu with options.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Menu name" }, template_type: { type: "string", description: "Template type" }, greeting_text: { type: "string", description: "Greeting" }, options: { type: "string", description: "JSON array of IVR options" } }, required: ["api_key", "business_id", "name"] },
  { name: "update_ivr_menu", description: "Update IVR menu and its options.", properties: { api_key: { type: "string", description: "Your API key" }, menu_id: { type: "string", description: "Menu UUID" }, updates: { type: "string", description: "JSON object of updates" }, options: { type: "string", description: "JSON array of options (optional)" } }, required: ["api_key", "menu_id"] },
  { name: "assign_number", description: "Assign a phone number to a handler.", properties: { api_key: { type: "string", description: "Your API key" }, phone_number_id: { type: "string", description: "Phone number UUID" }, handler_type: { type: "string", description: "ai_agent|human|ivr_menu" }, forward_to_phone: { type: "string", description: "Forward to phone (optional)" }, ivr_menu_id: { type: "string", description: "IVR menu UUID (optional)" }, mask_caller_id: { type: "string", description: "true/false" }, record_calls: { type: "string", description: "true/false" } }, required: ["api_key", "phone_number_id", "handler_type"] },

  // ── Contacts ──
  { name: "list_contacts", description: "List contacts for a business.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" }, offset: { type: "string", description: "Offset (optional)" } }, required: ["api_key", "business_id"] },
  { name: "create_contact", description: "Create a contact.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Contact name" }, phone: { type: "string", description: "Phone (optional)" }, email: { type: "string", description: "Email (optional)" } }, required: ["api_key", "business_id", "name"] },
  { name: "import_contacts", description: "Bulk import contacts.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, contacts: { type: "string", description: "JSON array of {name, phone, email}" } }, required: ["api_key", "business_id", "contacts"] },

  // ── Campaigns / Jobs ──
  { name: "list_campaigns", description: "List campaigns for a business.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_campaign", description: "Create a campaign.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Campaign name" }, script: { type: "string", description: "Call script" } }, required: ["api_key", "business_id", "name", "script"] },
  { name: "start_bulk_call", description: "Start a bulk calling job.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Job name" }, contact_ids: { type: "string", description: "JSON array of contact UUIDs" }, calls_per_minute: { type: "string", description: "Rate (optional)" }, concurrency_limit: { type: "string", description: "Concurrency (optional)" } }, required: ["api_key", "business_id", "name", "contact_ids"] },
  { name: "start_marketing_job", description: "Start a marketing job (RVM, SMS, etc.).", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Job name" }, job_type: { type: "string", description: "rvm|sms|one_ring|press_1" }, message_content: { type: "string", description: "Message content" }, contact_ids: { type: "string", description: "JSON array of contact UUIDs" }, caller_id: { type: "string", description: "Caller ID" }, callback_number: { type: "string", description: "Callback number (optional)" } }, required: ["api_key", "business_id", "name", "job_type", "message_content", "contact_ids", "caller_id"] },
  { name: "get_job_status", description: "Get job progress.", properties: { api_key: { type: "string", description: "Your API key" }, job_id: { type: "string", description: "Job UUID" }, job_kind: { type: "string", description: "bulk_call|marketing" } }, required: ["api_key", "job_id", "job_kind"] },
  { name: "pause_job", description: "Pause a running job.", properties: { api_key: { type: "string", description: "Your API key" }, job_id: { type: "string", description: "Job UUID" }, job_kind: { type: "string", description: "bulk_call|marketing" } }, required: ["api_key", "job_id", "job_kind"] },
  { name: "cancel_job", description: "Cancel a job.", properties: { api_key: { type: "string", description: "Your API key" }, job_id: { type: "string", description: "Job UUID" }, job_kind: { type: "string", description: "bulk_call|marketing" } }, required: ["api_key", "job_id", "job_kind"] },

  // ── Calls ──
  { name: "list_call_logs", description: "List call logs.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" }, direction: { type: "string", description: "inbound|outbound (optional)" } }, required: ["api_key", "business_id"] },
  { name: "list_call_summaries", description: "List AI call summaries.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },
  { name: "get_call_transcript", description: "Get full transcript for a call.", properties: { api_key: { type: "string", description: "Your API key" }, call_log_id: { type: "string", description: "Call log UUID" } }, required: ["api_key", "call_log_id"] },
  { name: "list_call_scores", description: "List call quality scores.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },
  { name: "list_call_transfers", description: "List call transfer history.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },
  { name: "list_dispositions", description: "List call dispositions.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },
  { name: "create_disposition", description: "Tag a call with a disposition.", properties: { api_key: { type: "string", description: "Your API key" }, call_log_id: { type: "string", description: "Call log UUID" }, business_id: { type: "string", description: "Business UUID" }, disposition: { type: "string", description: "Disposition label" }, notes: { type: "string", description: "Notes (optional)" } }, required: ["api_key", "call_log_id", "business_id", "disposition"] },

  // ── Config ──
  { name: "get_agent_config", description: "Get agent instructions & persona settings.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "update_agent_config", description: "Update agent configuration.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, updates: { type: "string", description: "JSON object of config updates" } }, required: ["api_key", "business_id", "updates"] },
  { name: "update_providers", description: "Update LLM/TTS/STT provider settings.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, updates: { type: "string", description: "JSON object of provider updates" } }, required: ["api_key", "business_id", "updates"] },

  // ── Routing / DNC ──
  { name: "list_routing_rules", description: "List call routing rules.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_routing_rule", description: "Create a call routing rule.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, condition_type: { type: "string", description: "time|caller_id|language|skill" }, condition_value: { type: "string", description: "Condition value" }, action: { type: "string", description: "agent|forward|queue|voicemail" }, target: { type: "string", description: "Target" }, priority: { type: "string", description: "Priority (optional)" } }, required: ["api_key", "business_id", "condition_type", "condition_value", "action", "target"] },
  { name: "delete_routing_rule", description: "Delete a routing rule.", properties: { api_key: { type: "string", description: "Your API key" }, rule_id: { type: "string", description: "Rule UUID" } }, required: ["api_key", "rule_id"] },
  { name: "manage_dnc", description: "Manage Do Not Call list.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, operation: { type: "string", description: "add|remove|list" }, phone_number: { type: "string", description: "Phone (for add/remove)" }, reason: { type: "string", description: "Reason (optional, for add)" } }, required: ["api_key", "business_id", "operation"] },

  // ── Knowledge Base ──
  { name: "list_knowledge_base", description: "List knowledge base items.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_knowledge_base_item", description: "Add a knowledge base item.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, title: { type: "string", description: "Title" }, content: { type: "string", description: "Content" } }, required: ["api_key", "business_id", "title", "content"] },
  { name: "delete_knowledge_base_item", description: "Delete a knowledge base item.", properties: { api_key: { type: "string", description: "Your API key" }, item_id: { type: "string", description: "Item UUID" } }, required: ["api_key", "item_id"] },

  // ── SLA ──
  { name: "list_sla_alerts", description: "List SLA violations/alerts.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID (optional)" }, acknowledged: { type: "string", description: "true/false (optional)" } }, required: ["api_key"] },
  { name: "create_sla_rule", description: "Create an SLA monitoring rule.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, metric: { type: "string", description: "Metric" }, threshold: { type: "string", description: "Threshold number" }, action: { type: "string", description: "Action" } }, required: ["api_key", "business_id", "metric", "threshold", "action"] },

  // ── Webhooks ──
  { name: "list_webhooks", description: "List registered webhook endpoints.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_webhook", description: "Register a webhook endpoint.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, url: { type: "string", description: "Webhook URL" }, events: { type: "string", description: "JSON array of event names" }, is_active: { type: "string", description: "true/false (optional)" } }, required: ["api_key", "business_id", "url", "events"] },
  { name: "delete_webhook", description: "Delete a webhook.", properties: { api_key: { type: "string", description: "Your API key" }, webhook_id: { type: "string", description: "Webhook UUID" } }, required: ["api_key", "webhook_id"] },

  // ── Experiments ──
  { name: "list_experiments", description: "List A/B test experiments.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_experiment", description: "Start an A/B test experiment.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Experiment name" }, variant_a_instructions: { type: "string", description: "Variant A prompt" }, variant_b_instructions: { type: "string", description: "Variant B prompt" }, traffic_split: { type: "string", description: "Split % (optional)" } }, required: ["api_key", "business_id", "name", "variant_a_instructions", "variant_b_instructions"] },

  // ── Customer Profiles ──
  { name: "list_customer_profiles", description: "List customer profiles with lead scores.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, min_lead_score: { type: "string", description: "Min score (optional)" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },

  // ── Voicemail ──
  { name: "manage_voicemail", description: "Get voicemail config or messages.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, operation: { type: "string", description: "get_settings|list_messages" } }, required: ["api_key", "business_id", "operation"] },

  // ── Monitoring ──
  { name: "get_dashboard_stats", description: "Get active calls, queue size, SLA status.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID (optional)" } }, required: ["api_key"] },
  { name: "get_analytics", description: "Get call volume, outcomes, revenue metrics.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, days: { type: "string", description: "Number of days (optional, default 7)" } }, required: ["api_key", "business_id"] },

  // ── Agent Learnings ──
  { name: "list_learnings", description: "List agent learnings/memory items.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, status: { type: "string", description: "pending|approved|rejected (optional)" } }, required: ["api_key", "business_id"] },
  { name: "create_learning", description: "Create a new agent learning.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, trigger_phrase: { type: "string", description: "Trigger phrase" }, learned_response: { type: "string", description: "Response" }, category: { type: "string", description: "faq|objection|upsell|policy (optional)" } }, required: ["api_key", "business_id", "trigger_phrase", "learned_response"] },
  { name: "update_learning_status", description: "Approve or reject an agent learning.", properties: { api_key: { type: "string", description: "Your API key" }, learning_id: { type: "string", description: "Learning UUID" }, status: { type: "string", description: "approved|rejected" } }, required: ["api_key", "learning_id", "status"] },

  // ── Templates ──
  { name: "list_templates", description: "List message templates.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_template", description: "Create a message template.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, trigger_event: { type: "string", description: "Event trigger" }, template_text: { type: "string", description: "Template text" }, channel: { type: "string", description: "sms|email|whatsapp (optional)" } }, required: ["api_key", "business_id", "trigger_event", "template_text"] },
  { name: "update_template", description: "Update a message template.", properties: { api_key: { type: "string", description: "Your API key" }, template_id: { type: "string", description: "Template UUID" }, updates: { type: "string", description: "JSON object of updates" } }, required: ["api_key", "template_id"] },
  { name: "delete_template", description: "Delete a message template.", properties: { api_key: { type: "string", description: "Your API key" }, template_id: { type: "string", description: "Template UUID" } }, required: ["api_key", "template_id"] },

  // ── Segments ──
  { name: "list_segments", description: "List contact segments.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "create_segment", description: "Create a contact segment.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, name: { type: "string", description: "Segment name" }, filter_criteria: { type: "string", description: "JSON filter object" } }, required: ["api_key", "business_id", "name", "filter_criteria"] },
  { name: "delete_segment", description: "Delete a contact segment.", properties: { api_key: { type: "string", description: "Your API key" }, segment_id: { type: "string", description: "Segment UUID" } }, required: ["api_key", "segment_id"] },

  // ── Availability ──
  { name: "get_availability", description: "Get availability slots for a business.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "set_availability", description: "Set availability slots (replaces existing).", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, slots: { type: "string", description: "JSON array of {day_of_week, start_time, end_time, is_available}" } }, required: ["api_key", "business_id", "slots"] },

  // ── Capacity ──
  { name: "get_inbound_capacity", description: "Get inbound capacity config.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "update_inbound_capacity", description: "Update inbound capacity settings.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, max_concurrent_calls: { type: "string", description: "Max calls (optional)" }, overflow_action: { type: "string", description: "queue|voicemail|forward (optional)" }, overflow_target: { type: "string", description: "Target (optional)" }, auto_scale: { type: "string", description: "true/false (optional)" } }, required: ["api_key", "business_id"] },

  // ── Approvals ──
  { name: "list_approvals", description: "List approval requests.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID (optional)" }, status: { type: "string", description: "pending|approved|rejected (optional)" } }, required: ["api_key"] },
  { name: "approve_request", description: "Approve a pending request.", properties: { api_key: { type: "string", description: "Your API key" }, request_id: { type: "string", description: "Request UUID" } }, required: ["api_key", "request_id"] },
  { name: "reject_request", description: "Reject a pending request.", properties: { api_key: { type: "string", description: "Your API key" }, request_id: { type: "string", description: "Request UUID" } }, required: ["api_key", "request_id"] },

  // ── Queue ──
  { name: "list_queue", description: "List callers currently in queue.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },
  { name: "clear_queue", description: "Clear the call queue for a business.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" } }, required: ["api_key", "business_id"] },

  // ── Competitors ──
  { name: "list_competitor_mentions", description: "List competitor mentions detected in calls.", properties: { api_key: { type: "string", description: "Your API key" }, business_id: { type: "string", description: "Business UUID" }, limit: { type: "string", description: "Max results (optional)" } }, required: ["api_key", "business_id"] },

  // ── Meta ──
  { name: "help", description: "Returns full API documentation with all available actions and their parameters.", properties: { api_key: { type: "string", description: "Your API key" } }, required: ["api_key"] },
];

// ── Build MCP Server ──
const mcpServer = new McpServer({
  name: "AgentHub MCP Server",
  version: "1.0.0",
});

for (const tool of toolDefs) {
  const inputSchema: Record<string, unknown> = {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(tool.properties).map(([k, v]) => [k, { type: v.type, description: v.description }])
    ),
    required: tool.required,
  };

  mcpServer.tool({
    name: tool.name,
    description: tool.description,
    inputSchema,
    handler: async (params: Record<string, unknown>) => {
      const apiKey = params.api_key as string;
      if (!apiKey) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "api_key is required" }) }] };
      }

      // Build the params to forward (strip api_key)
      const forwardParams: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(params)) {
        if (k === "api_key") continue;
        // Try parsing JSON strings for complex params
        if (typeof v === "string" && (k === "updates" || k === "options" || k === "contacts" || k === "contact_ids" || k === "events" || k === "slots" || k === "filter_criteria")) {
          try { forwardParams[k] = JSON.parse(v); } catch { forwardParams[k] = v; }
        } else if (typeof v === "string" && (k === "limit" || k === "offset" || k === "days" || k === "threshold" || k === "priority" || k === "traffic_split" || k === "calls_per_minute" || k === "concurrency_limit" || k === "max_concurrent_calls" || k === "min_lead_score")) {
          const n = Number(v);
          forwardParams[k] = isNaN(n) ? v : n;
        } else if (typeof v === "string" && (k === "mask_caller_id" || k === "record_calls" || k === "is_active" || k === "auto_scale" || k === "acknowledged")) {
          forwardParams[k] = v === "true";
        } else {
          forwardParams[k] = v;
        }
      }

      try {
        const result = await callDashboardApi(apiKey, tool.name, forwardParams);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { content: [{ type: "text", text: JSON.stringify({ error: msg }) }] };
      }
    },
  });
}

// ── HTTP Transport via Hono ──
const app = new Hono();
const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
