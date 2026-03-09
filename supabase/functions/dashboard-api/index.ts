import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: corsHeaders,
  });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status,
    headers: corsHeaders,
  });
}

async function hashKey(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Help / self-discovery ──────────────────────────────────────────
const API_DOCS = {
  name: "AgentHub Dashboard Control API",
  version: "2.0.0",
  auth: "Bearer <api_key> header. Create keys in Settings → API Keys.",
  actions: {
    // Businesses
    list_businesses: { params: {}, description: "List all your businesses." },
    get_business: { params: { business_id: "uuid" }, description: "Get a single business." },
    create_business: { params: { name: "string", industry: "string (optional)", instructions: "string (optional)" }, description: "Create a new business." },
    update_business: { params: { business_id: "uuid", updates: "object" }, description: "Update business fields." },
    delete_business: { params: { business_id: "uuid" }, description: "Delete a business and all related data." },
    // Phone / IVR
    list_phone_numbers: { params: { business_id: "uuid" }, description: "List phone numbers for a business." },
    create_phone_number: { params: { business_id: "uuid", phone_number: "string", provider: "string (optional)", direction: "inbound|outbound|both (optional)", label: "string (optional)" }, description: "Register a new phone number." },
    create_ivr_menu: { params: { business_id: "uuid", name: "string", template_type: "string", greeting_text: "string", options: "array" }, description: "Create an IVR menu with options." },
    update_ivr_menu: { params: { menu_id: "uuid", updates: "object", options: "array (optional)" }, description: "Update IVR menu and its options." },
    assign_number: { params: { phone_number_id: "uuid", handler_type: "ai_agent|human|ivr_menu", forward_to_phone: "string (optional)", ivr_menu_id: "uuid (optional)", mask_caller_id: "bool", record_calls: "bool" }, description: "Assign a phone number to a handler." },
    // Contacts
    list_contacts: { params: { business_id: "uuid", limit: "number (optional)", offset: "number (optional)" }, description: "List contacts." },
    create_contact: { params: { business_id: "uuid", name: "string", phone: "string (optional)", email: "string (optional)" }, description: "Create a contact." },
    import_contacts: { params: { business_id: "uuid", contacts: "array of {name, phone, email}" }, description: "Bulk import contacts." },
    // Campaigns
    list_campaigns: { params: { business_id: "uuid" }, description: "List campaigns." },
    create_campaign: { params: { business_id: "uuid", name: "string", script: "string" }, description: "Create a campaign." },
    start_bulk_call: { params: { business_id: "uuid", name: "string", contact_ids: "array of uuid", calls_per_minute: "number (optional)", concurrency_limit: "number (optional)" }, description: "Start a bulk calling job." },
    start_marketing_job: { params: { business_id: "uuid", name: "string", job_type: "rvm|sms|one_ring|press_1", message_content: "string", contact_ids: "array of uuid", caller_id: "string", callback_number: "string (optional)" }, description: "Start a marketing job (RVM, SMS, etc.)." },
    get_job_status: { params: { job_id: "uuid", job_kind: "bulk_call|marketing" }, description: "Get job progress." },
    pause_job: { params: { job_id: "uuid", job_kind: "bulk_call|marketing" }, description: "Pause a running job." },
    cancel_job: { params: { job_id: "uuid", job_kind: "bulk_call|marketing" }, description: "Cancel a job." },
    // Calls
    list_call_logs: { params: { business_id: "uuid", limit: "number (optional)", direction: "inbound|outbound (optional)" }, description: "List call logs." },
    list_call_summaries: { params: { business_id: "uuid", limit: "number (optional)" }, description: "List AI call summaries." },
    get_call_transcript: { params: { call_log_id: "uuid" }, description: "Get full transcript for a call." },
    // Config
    get_agent_config: { params: { business_id: "uuid" }, description: "Get agent instructions & persona settings." },
    update_agent_config: { params: { business_id: "uuid", updates: "object (instructions, greeting_message, personality_*, voice, etc.)" }, description: "Update agent configuration." },
    update_providers: { params: { business_id: "uuid", updates: "object (llm_provider, llm_model, tts_provider, stt_provider, etc.)" }, description: "Update LLM/TTS/STT provider settings." },
    // Routing
    list_routing_rules: { params: { business_id: "uuid" }, description: "List call routing rules." },
    create_routing_rule: { params: { business_id: "uuid", condition_type: "time|caller_id|language|skill", condition_value: "string", action: "agent|forward|queue|voicemail", target: "string", priority: "number (optional)" }, description: "Create a call routing rule." },
    // DNC
    manage_dnc: { params: { business_id: "uuid", operation: "add|remove|list", phone_number: "string (for add/remove)", reason: "string (optional, for add)" }, description: "Manage Do Not Call list." },
    // Knowledge Base
    list_knowledge_base: { params: { business_id: "uuid" }, description: "List knowledge base items." },
    update_knowledge_base: { params: { business_id: "uuid", title: "string", content: "string" }, description: "Add/update a knowledge base item." },
    // SLA
    list_sla_alerts: { params: { business_id: "uuid (optional)", acknowledged: "bool (optional)" }, description: "List SLA violations/alerts." },
    create_sla_rule: { params: { business_id: "uuid", metric: "string", threshold: "number", action: "string" }, description: "Create an SLA monitoring rule." },
    // Webhooks
    list_webhooks: { params: { business_id: "uuid" }, description: "List registered webhook endpoints." },
    create_webhook: { params: { business_id: "uuid", url: "string", events: "array of strings", is_active: "bool (optional)" }, description: "Register a webhook endpoint." },
    // Experiments
    list_experiments: { params: { business_id: "uuid" }, description: "List A/B test experiments." },
    create_experiment: { params: { business_id: "uuid", name: "string", variant_a_instructions: "string", variant_b_instructions: "string", traffic_split: "number (optional)" }, description: "Start an A/B test experiment." },
    // Customer Profiles
    list_customer_profiles: { params: { business_id: "uuid", min_lead_score: "number (optional)", limit: "number (optional)" }, description: "List customer profiles with lead scores." },
    // Voicemail
    manage_voicemail: { params: { business_id: "uuid", operation: "get_settings|list_messages" }, description: "Get voicemail config or messages." },
    // Monitoring
    get_dashboard_stats: { params: { business_id: "uuid (optional)" }, description: "Get active calls, queue size, SLA status." },
    get_analytics: { params: { business_id: "uuid", days: "number (optional, default 7)" }, description: "Get call volume, outcomes, revenue metrics." },
    // Meta
    help: { params: {}, description: "Returns this documentation." },
  },
};

// ── Field allowlists ──────────────────────────────────────────────
const ALLOWED_BUSINESS_FIELDS = new Set([
  "name", "industry", "instructions", "greeting_message", "voice",
  "knowledge_base", "sales_script", "objection_handling", "closing_techniques",
  "upsell_prompts", "agent_mode", "status", "timezone", "default_language",
  "supported_languages", "greeting_audio_url", "hold_music_url",
  "personality_friendliness", "personality_formality", "personality_urgency",
  "personality_humor", "endpointing_threshold_ms", "barge_in_enabled",
  "voicemail_detection_enabled", "ivr_enabled", "default_ivr_menu_id",
  "livekit_enabled", "livekit_room_prefix",
]);

const ALLOWED_PROVIDER_FIELDS = new Set([
  "llm_provider", "llm_model", "llm_api_endpoint", "llm_api_key_name",
  "tts_provider", "tts_voice_id", "tts_api_endpoint", "tts_api_key_name",
  "stt_provider", "stt_model",
]);

const ALLOWED_IVR_FIELDS = new Set([
  "name", "template_type", "greeting_text", "greeting_audio_url",
  "fallback_action", "fallback_target", "max_retries", "timeout_seconds", "is_active",
]);

function filterFields(updates: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.has(k)));
}

async function verifyBusinessOwnership(supabase: any, businessId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from("businesses").select("id").eq("id", businessId).eq("user_id", userId).maybeSingle();
  return !!data;
}

async function verifyJobOwnership(supabase: any, jobId: string, table: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from(table).select("business_id, businesses!inner(user_id)").eq("id", jobId).single();
  return data && (data as any).businesses?.user_id === userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") return err("POST only", 405);

  // ── Auth ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer "))
    return err("Missing Bearer token", 401);
  const token = authHeader.replace("Bearer ", "").trim();
  const keyHash = await hashKey(token);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: apiKey, error: keyErr } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (keyErr || !apiKey) return err("Invalid or inactive API key", 401);

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id);

  // ── Parse body ──────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }
  const action = body.action as string;
  if (!action) return err("Missing 'action' field");

  // ── Helpers ─────────────────────────────────────────────────────
  const bid = body.business_id as string | undefined;

  try {
    switch (action) {
      // ── Help ──────────────────────────────────────────────────
      case "help":
        return ok(API_DOCS);

      // ── Businesses ────────────────────────────────────────────
      case "list_businesses": {
        const { data } = await supabase
          .from("businesses")
          .select("id,name,status,industry,agent_mode,created_at")
          .eq("user_id", apiKey.user_id)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "get_business": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", bid)
          .eq("user_id", apiKey.user_id)
          .single();
        return ok(data);
      }
      case "create_business": {
        const { data, error } = await supabase
          .from("businesses")
          .insert({
            user_id: apiKey.user_id,
            name: body.name as string,
            industry: (body.industry as string) || "restaurant",
            instructions: (body.instructions as string) || "",
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }
      case "update_business": {
        if (!bid) return err("business_id required");
        const updates = body.updates as Record<string, unknown>;
        if (!updates) return err("updates object required");
        const safeUpdates = filterFields(updates, ALLOWED_BUSINESS_FIELDS);
        if (Object.keys(safeUpdates).length === 0) return err("No allowed fields in updates");
        const { data, error } = await supabase
          .from("businesses")
          .update(safeUpdates)
          .eq("id", bid)
          .eq("user_id", apiKey.user_id)
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }
      case "delete_business": {
        if (!bid) return err("business_id required");
        const { error } = await supabase
          .from("businesses")
          .delete()
          .eq("id", bid)
          .eq("user_id", apiKey.user_id);
        if (error) return err(error.message);
        return ok({ deleted: true });
      }

      // ── Phone Numbers ─────────────────────────────────────────
      case "list_phone_numbers": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "create_phone_number": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("phone_numbers")
          .insert({
            business_id: bid,
            phone_number: body.phone_number as string,
            provider: (body.provider as string) || "twilio",
            direction: (body.direction as string) || "both",
            label: (body.label as string) || null,
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── IVR ───────────────────────────────────────────────────
      case "create_ivr_menu": {
        if (!bid) return err("business_id required");
        const { data: menu, error: menuErr } = await supabase
          .from("ivr_menus")
          .insert({
            business_id: bid,
            name: body.name as string,
            template_type: (body.template_type as string) || "custom",
            greeting_text: (body.greeting_text as string) || "",
          })
          .select()
          .single();
        if (menuErr) return err(menuErr.message);
        const opts = body.options as Array<Record<string, unknown>>;
        if (opts?.length) {
          const rows = opts.map((o) => ({
            ivr_menu_id: menu.id,
            business_id: bid,
            digit: o.digit as string,
            label: o.label as string,
            action: (o.action as string) || "ai_agent",
            target_phone: (o.target_phone as string) || null,
            agent_instructions: (o.agent_instructions as string) || null,
            mask_caller_id: !!o.mask_caller_id,
            record_call: o.record_call !== false,
          }));
          await supabase.from("ivr_options").insert(rows);
        }
        return ok(menu);
      }
      case "update_ivr_menu": {
        const menuId = body.menu_id as string;
        if (!menuId) return err("menu_id required");
        // Verify ownership via ivr_menus -> businesses
        const { data: menuCheck } = await supabase.from("ivr_menus").select("business_id, businesses!inner(user_id)").eq("id", menuId).single();
        if (!menuCheck || (menuCheck as any).businesses?.user_id !== apiKey.user_id) return err("Unauthorized", 403);
        const updates = body.updates as Record<string, unknown>;
        if (updates) {
          const safeUpdates = filterFields(updates, ALLOWED_IVR_FIELDS);
          if (Object.keys(safeUpdates).length > 0) {
            await supabase.from("ivr_menus").update(safeUpdates).eq("id", menuId);
          }
        }
        const opts = body.options as Array<Record<string, unknown>>;
        if (opts) {
          await supabase.from("ivr_options").delete().eq("ivr_menu_id", menuId);
          const rows = opts.map((o) => ({
            ivr_menu_id: menuId,
            business_id: menuCheck.business_id,
            digit: o.digit as string,
            label: o.label as string,
            action: (o.action as string) || "ai_agent",
            target_phone: (o.target_phone as string) || null,
            agent_instructions: (o.agent_instructions as string) || null,
            mask_caller_id: !!o.mask_caller_id,
            record_call: o.record_call !== false,
          }));
          await supabase.from("ivr_options").insert(rows);
        }
        return ok({ updated: true });
      }
      case "assign_number": {
        const pnId = body.phone_number_id as string;
        if (!pnId) return err("phone_number_id required");
        // Verify ownership
        const { data: pnCheck } = await supabase.from("phone_numbers").select("business_id, businesses!inner(user_id)").eq("id", pnId).single();
        if (!pnCheck || (pnCheck as any).businesses?.user_id !== apiKey.user_id) return err("Unauthorized", 403);
        const { data, error } = await supabase
          .from("phone_numbers")
          .update({
            assigned_handler_type: (body.handler_type as string) || "ai_agent",
            forward_to_phone: (body.forward_to_phone as string) || null,
            ivr_menu_id: (body.ivr_menu_id as string) || null,
            mask_caller_id: !!body.mask_caller_id,
            record_calls: body.record_calls !== false,
          })
          .eq("id", pnId)
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── Contacts ──────────────────────────────────────────────
      case "list_contacts": {
        if (!bid) return err("business_id required");
        const limit = (body.limit as number) || 100;
        const offset = (body.offset as number) || 0;
        const { data } = await supabase
          .from("contacts")
          .select("*")
          .eq("business_id", bid)
          .range(offset, offset + limit - 1)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "create_contact": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("contacts")
          .insert({
            business_id: bid,
            name: body.name as string,
            phone: (body.phone as string) || null,
            email: (body.email as string) || null,
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }
      case "import_contacts": {
        if (!bid) return err("business_id required");
        const contacts = body.contacts as Array<Record<string, string>>;
        if (!contacts?.length) return err("contacts array required");
        const rows = contacts.map((c) => ({
          business_id: bid,
          name: c.name,
          phone: c.phone || null,
          email: c.email || null,
        }));
        const { data, error } = await supabase.from("contacts").insert(rows).select();
        if (error) return err(error.message);
        return ok({ imported: data?.length ?? 0 });
      }

      // ── Campaigns ─────────────────────────────────────────────
      case "list_campaigns": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("campaigns")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "create_campaign": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("campaigns")
          .insert({
            business_id: bid,
            name: body.name as string,
            script: (body.script as string) || "",
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }
      case "start_bulk_call": {
        if (!bid) return err("business_id required");
        const contactIds = body.contact_ids as string[];
        if (!contactIds?.length) return err("contact_ids required");
        const { data: job, error: jobErr } = await supabase
          .from("bulk_call_jobs")
          .insert({
            business_id: bid,
            name: (body.name as string) || "API Bulk Call",
            total_contacts: contactIds.length,
            calls_per_minute: (body.calls_per_minute as number) || 10,
            concurrency_limit: (body.concurrency_limit as number) || 5,
            status: "queued",
          })
          .select()
          .single();
        if (jobErr) return err(jobErr.message);
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id,name,phone")
          .in("id", contactIds);
        if (contacts?.length) {
          const entries = contacts.map((c) => ({
            job_id: job.id,
            business_id: bid,
            contact_name: c.name,
            contact_phone: c.phone || "",
            status: "pending",
          }));
          await supabase.from("bulk_call_entries").insert(entries);
        }
        return ok(job);
      }
      case "start_marketing_job": {
        if (!bid) return err("business_id required");
        const contactIds = body.contact_ids as string[];
        if (!contactIds?.length) return err("contact_ids required");
        const { data: job, error: jobErr } = await supabase
          .from("bulk_marketing_jobs")
          .insert({
            business_id: bid,
            name: (body.name as string) || "API Marketing Job",
            job_type: (body.job_type as string) || "rvm",
            message_content: (body.message_content as string) || "",
            total_contacts: contactIds.length,
            caller_id: (body.caller_id as string) || "",
            callback_number: (body.callback_number as string) || "",
            status: "queued",
          })
          .select()
          .single();
        if (jobErr) return err(jobErr.message);
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id,name,phone")
          .in("id", contactIds);
        if (contacts?.length) {
          const entries = contacts.map((c) => ({
            job_id: job.id,
            business_id: bid,
            contact_name: c.name,
            contact_phone: c.phone || "",
            status: "pending",
          }));
          await supabase.from("bulk_marketing_entries").insert(entries);
        }
        return ok(job);
      }
      case "get_job_status": {
        const jobId = body.job_id as string;
        const kind = body.job_kind as string;
        if (!jobId || !kind) return err("job_id and job_kind required");
        const table = kind === "marketing" ? "bulk_marketing_jobs" : "bulk_call_jobs";
        if (!(await verifyJobOwnership(supabase, jobId, table, apiKey.user_id))) return err("Unauthorized", 403);
        const { data } = await supabase.from(table).select("*").eq("id", jobId).single();
        return ok(data);
      }
      case "pause_job": {
        const jobId = body.job_id as string;
        const kind = body.job_kind as string;
        if (!jobId || !kind) return err("job_id and job_kind required");
        const table = kind === "marketing" ? "bulk_marketing_jobs" : "bulk_call_jobs";
        if (!(await verifyJobOwnership(supabase, jobId, table, apiKey.user_id))) return err("Unauthorized", 403);
        await supabase.from(table).update({ status: "paused" }).eq("id", jobId);
        return ok({ paused: true });
      }
      case "cancel_job": {
        const jobId = body.job_id as string;
        const kind = body.job_kind as string;
        if (!jobId || !kind) return err("job_id and job_kind required");
        const table = kind === "marketing" ? "bulk_marketing_jobs" : "bulk_call_jobs";
        if (!(await verifyJobOwnership(supabase, jobId, table, apiKey.user_id))) return err("Unauthorized", 403);
        await supabase.from(table).update({ status: "cancelled" }).eq("id", jobId);
        return ok({ cancelled: true });
      }

      // ── Call Logs ─────────────────────────────────────────────
      case "list_call_logs": {
        if (!bid) return err("business_id required");
        let q = supabase
          .from("call_logs")
          .select("*")
          .eq("business_id", bid)
          .order("started_at", { ascending: false })
          .limit((body.limit as number) || 50);
        if (body.direction) q = q.eq("direction", body.direction as string);
        const { data } = await q;
        return ok(data);
      }
      case "list_call_summaries": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("call_summaries")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false })
          .limit((body.limit as number) || 50);
        return ok(data);
      }
      case "get_call_transcript": {
        const clId = body.call_log_id as string;
        if (!clId) return err("call_log_id required");
        // Verify ownership via call_logs -> businesses
        const { data: clCheck } = await supabase.from("call_logs").select("business_id, businesses!inner(user_id)").eq("id", clId).single();
        if (!clCheck || (clCheck as any).businesses?.user_id !== apiKey.user_id) return err("Unauthorized", 403);
        const { data } = await supabase
          .from("call_logs")
          .select("id,transcript,caller_name,caller_number,started_at,duration_seconds")
          .eq("id", clId)
          .single();
        return ok(data);
      }

      // ── Config ────────────────────────────────────────────────
      case "get_agent_config": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("businesses")
          .select("instructions,greeting_message,voice,personality_friendliness,personality_formality,personality_urgency,personality_humor,knowledge_base,sales_script,objection_handling,closing_techniques,upsell_prompts,agent_mode")
          .eq("id", bid)
          .single();
        return ok(data);
      }
      case "update_agent_config": {
        if (!bid) return err("business_id required");
        const updates = body.updates as Record<string, unknown>;
        if (!updates) return err("updates required");
        const safeUpdates = filterFields(updates, ALLOWED_BUSINESS_FIELDS);
        if (Object.keys(safeUpdates).length === 0) return err("No allowed fields in updates");
        const { data, error } = await supabase
          .from("businesses")
          .update(safeUpdates)
          .eq("id", bid)
          .eq("user_id", apiKey.user_id)
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }
      case "update_providers": {
        if (!bid) return err("business_id required");
        const updates = body.updates as Record<string, unknown>;
        if (!updates) return err("updates required");
        const safeUpdates = filterFields(updates, ALLOWED_PROVIDER_FIELDS);
        if (Object.keys(safeUpdates).length === 0) return err("No allowed fields in updates");
        const { data, error } = await supabase
          .from("businesses")
          .update(safeUpdates)
          .eq("id", bid)
          .eq("user_id", apiKey.user_id)
          .select("llm_provider,llm_model,tts_provider,stt_provider,stt_model")
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── Routing Rules ─────────────────────────────────────────
      case "list_routing_rules": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("call_routing_rules")
          .select("*")
          .eq("business_id", bid)
          .order("priority", { ascending: true });
        return ok(data);
      }
      case "create_routing_rule": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("call_routing_rules")
          .insert({
            business_id: bid,
            condition_type: (body.condition_type as string) || "time",
            condition_value: (body.condition_value as string) || "",
            action: (body.action_type as string) || "agent",
            target: (body.target as string) || "",
            priority: (body.priority as number) || 0,
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── DNC ───────────────────────────────────────────────────
      case "manage_dnc": {
        if (!bid) return err("business_id required");
        const op = body.operation as string;
        if (op === "list") {
          const { data } = await supabase
            .from("dnc_list")
            .select("*")
            .eq("business_id", bid)
            .order("added_at", { ascending: false })
            .limit(500);
          return ok(data);
        }
        if (op === "add") {
          const phone = body.phone_number as string;
          if (!phone) return err("phone_number required");
          const { data, error } = await supabase
            .from("dnc_list")
            .insert({ business_id: bid, phone_number: phone, reason: (body.reason as string) || "" })
            .select()
            .single();
          if (error) return err(error.message);
          return ok(data);
        }
        if (op === "remove") {
          const phone = body.phone_number as string;
          if (!phone) return err("phone_number required");
          await supabase.from("dnc_list").delete().eq("business_id", bid).eq("phone_number", phone);
          return ok({ removed: true });
        }
        return err("operation must be add, remove, or list");
      }

      // ── Knowledge Base ────────────────────────────────────────
      case "list_knowledge_base": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("knowledge_base_items")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "update_knowledge_base": {
        if (!bid) return err("business_id required");
        const title = body.title as string;
        const content = body.content as string;
        if (!title || !content) return err("title and content required");
        const { data, error } = await supabase
          .from("knowledge_base_items")
          .insert({ business_id: bid, title, content })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── SLA ───────────────────────────────────────────────────
      case "list_sla_alerts": {
        let q = supabase
          .from("sla_alerts")
          .select("*, businesses(name)")
          .order("created_at", { ascending: false })
          .limit(50);
        if (bid) q = q.eq("business_id", bid);
        if (body.acknowledged !== undefined) q = q.eq("acknowledged", body.acknowledged as boolean);
        const { data } = await q;
        return ok(data);
      }
      case "create_sla_rule": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("sla_rules")
          .insert({
            business_id: bid,
            metric: (body.metric as string) || "response_time",
            threshold: (body.threshold as number) || 30,
            action: (body.sla_action as string) || "alert",
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── Webhooks ──────────────────────────────────────────────
      case "list_webhooks": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("webhooks")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "create_webhook": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("webhooks")
          .insert({
            business_id: bid,
            url: body.url as string,
            events: body.events as string[],
            is_active: body.is_active !== false,
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── Experiments ───────────────────────────────────────────
      case "list_experiments": {
        if (!bid) return err("business_id required");
        const { data } = await supabase
          .from("ab_tests")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        return ok(data);
      }
      case "create_experiment": {
        if (!bid) return err("business_id required");
        const { data, error } = await supabase
          .from("ab_tests")
          .insert({
            business_id: bid,
            name: (body.name as string) || "API Experiment",
            variant_a_instructions: (body.variant_a_instructions as string) || "",
            variant_b_instructions: (body.variant_b_instructions as string) || "",
            traffic_split: (body.traffic_split as number) || 50,
            status: "running",
            started_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) return err(error.message);
        return ok(data);
      }

      // ── Customer Profiles ─────────────────────────────────────
      case "list_customer_profiles": {
        if (!bid) return err("business_id required");
        let q = supabase
          .from("customer_profiles")
          .select("*")
          .eq("business_id", bid)
          .order("lead_score", { ascending: false })
          .limit((body.limit as number) || 50);
        if (body.min_lead_score) q = q.gte("lead_score", body.min_lead_score as number);
        const { data } = await q;
        return ok(data);
      }

      // ── Voicemail ─────────────────────────────────────────────
      case "manage_voicemail": {
        if (!bid) return err("business_id required");
        const op = (body.operation as string) || "get_settings";
        if (op === "get_settings") {
          const { data } = await supabase
            .from("businesses")
            .select("id,name,voicemail_detection_enabled,greeting_message,greeting_audio_url")
            .eq("id", bid)
            .single();
          return ok(data);
        }
        if (op === "list_messages") {
          const { data } = await supabase
            .from("call_logs")
            .select("id,caller_name,caller_number,recording_url,transcript,started_at,duration_seconds")
            .eq("business_id", bid)
            .eq("outcome", "voicemail")
            .order("started_at", { ascending: false })
            .limit(50);
          return ok(data);
        }
        return err("operation must be get_settings or list_messages");
      }

      // ── Monitoring ────────────────────────────────────────────
      case "get_dashboard_stats": {
        let queueQ = supabase.from("call_queue").select("id", { count: "exact", head: true }).eq("status", "waiting");
        if (bid) queueQ = queueQ.eq("business_id", bid);
        const { count: queueCount } = await queueQ;

        let activeQ = supabase.from("call_logs").select("id", { count: "exact", head: true }).is("ended_at", null);
        if (bid) activeQ = activeQ.eq("business_id", bid);
        const { count: activeCount } = await activeQ;

        let pendingQ = supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
        if (bid) pendingQ = pendingQ.eq("business_id", bid);
        const { count: pendingApprovals } = await pendingQ;

        return ok({
          active_calls: activeCount || 0,
          queue_size: queueCount || 0,
          pending_approvals: pendingApprovals || 0,
        });
      }
      case "get_analytics": {
        if (!bid) return err("business_id required");
        const days = (body.days as number) || 7;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data: logs } = await supabase
          .from("call_logs")
          .select("id,direction,outcome,duration_seconds,started_at")
          .eq("business_id", bid)
          .gte("started_at", since);
        const total = logs?.length || 0;
        const totalDuration = logs?.reduce((s, l) => s + (l.duration_seconds || 0), 0) || 0;
        const outcomes: Record<string, number> = {};
        logs?.forEach((l) => {
          const o = l.outcome || "unknown";
          outcomes[o] = (outcomes[o] || 0) + 1;
        });
        return ok({
          period_days: days,
          total_calls: total,
          total_duration_seconds: totalDuration,
          avg_duration_seconds: total ? Math.round(totalDuration / total) : 0,
          outcomes,
        });
      }

      default:
        return err(`Unknown action: ${action}. Use action 'help' to see all ${Object.keys(API_DOCS.actions).length} available actions.`);
    }
  } catch (e) {
    return err(e.message || "Internal error", 500);
  }
});
