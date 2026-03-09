import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // ── Handle webhook setup ──
    if (body.action === "set_webhook") {
      const { user_id } = body;
      const { data: config } = await supabase.from("telegram_config").select("*").eq("user_id", user_id).eq("is_active", true).single();
      if (!config) return new Response(JSON.stringify({ error: "No active config" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const botToken = Deno.env.get(config.bot_token_secret_name) || "";
      if (!botToken) return new Response(JSON.stringify({ error: "Bot token secret not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const result = await res.json();
      return new Response(JSON.stringify({ ok: true, webhook: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Handle notification sending (called internally) ──
    if (body.action === "notify") {
      const { user_id, message } = body;
      const { data: config } = await supabase.from("telegram_config").select("*").eq("user_id", user_id).eq("is_active", true).single();
      if (config) {
        const botToken = Deno.env.get(config.bot_token_secret_name) || "";
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: config.chat_id, text: message, parse_mode: "Markdown" }),
          });
        }
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Handle Telegram webhook updates ──
    if (!body.message?.text) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();
    const command = text.split(" ")[0].toLowerCase().replace("@", "").split("@")[0];

    // Find user by chat_id
    const { data: config } = await supabase
      .from("telegram_config")
      .select("*")
      .eq("chat_id", chatId.toString())
      .eq("is_active", true)
      .single();

    if (!config) {
      await sendTg(null, chatId, "⚠️ This chat is not linked to any AgentHub account. Set your chat ID in Settings.", body);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = config.user_id;
    const botToken = Deno.env.get(config.bot_token_secret_name) || "";
    let response = "";

    // Helper: find business by name
    async function findBiz(name: string) {
      if (!name) return null;
      const { data } = await supabase.from("businesses").select("*").eq("user_id", userId).ilike("name", `%${name.trim()}%`).limit(1).single();
      return data;
    }

    // Helper: split by pipe
    function pipeSplit(t: string, cmd: string) {
      return t.replace(cmd, "").split("|").map(s => s.trim());
    }

    switch (command) {
      // ════════════════════════════════════════════════════════
      // MONITORING (original + enhanced)
      // ════════════════════════════════════════════════════════
      case "/status": {
        const { count: businessCount } = await supabase.from("businesses").select("*", { count: "exact", head: true }).eq("user_id", userId);
        const { count: activeCalls } = await supabase.from("call_logs").select("*", { count: "exact", head: true }).is("ended_at", null);
        const { count: queueCount } = await supabase.from("call_queue").select("*", { count: "exact", head: true }).eq("status", "waiting");
        const { count: pendingApprovals } = await supabase.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
        response = `📊 *Platform Status*\n🏢 Businesses: ${businessCount}\n📞 Active Calls: ${activeCalls}\n⏳ Queue: ${queueCount}\n📋 Pending Approvals: ${pendingApprovals}`;
        break;
      }

      case "/calls": {
        const today = new Date().toISOString().split("T")[0];
        const { data: calls } = await supabase.from("call_logs").select("*, businesses(name)").gte("started_at", today + "T00:00:00Z").order("started_at", { ascending: false }).limit(10);
        if (!calls?.length) { response = "📞 No calls today yet."; break; }
        response = `📞 *Today's Calls (${calls.length})*\n` + calls.map((c: any) => `• ${c.businesses?.name || "?"}: ${c.caller_name || c.caller_number || "Unknown"} (${c.duration_seconds || 0}s) ${c.outcome || ""}`).join("\n");
        break;
      }

      case "/report": {
        const bizName = text.replace("/report", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business "${bizName}" not found.`; break; }
        const today = new Date().toISOString().split("T")[0];
        const { count: todayCalls } = await supabase.from("call_logs").select("*", { count: "exact", head: true }).eq("business_id", biz.id).gte("started_at", today + "T00:00:00Z");
        const { count: totalContacts } = await supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", biz.id);
        response = `📋 *Report: ${biz.name}*\nStatus: ${biz.status}\nMode: ${biz.agent_mode}\nToday's Calls: ${todayCalls}\nTotal Contacts: ${totalContacts}\nVoice: ${biz.voice}\nLLM: ${biz.llm_model}`;
        break;
      }

      case "/analytics": {
        const bizName = text.replace("/analytics", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: logs } = await supabase.from("call_logs").select("outcome,duration_seconds").eq("business_id", biz.id).gte("started_at", since);
        const total = logs?.length || 0;
        const totalDur = logs?.reduce((s, l) => s + (l.duration_seconds || 0), 0) || 0;
        const outcomes: Record<string, number> = {};
        logs?.forEach(l => { const o = l.outcome || "unknown"; outcomes[o] = (outcomes[o] || 0) + 1; });
        const outStr = Object.entries(outcomes).map(([k, v]) => `  ${k}: ${v}`).join("\n");
        response = `📊 *Analytics: ${biz.name} (7d)*\nTotal Calls: ${total}\nTotal Duration: ${Math.round(totalDur / 60)}m\nAvg Duration: ${total ? Math.round(totalDur / total) : 0}s\n\n*Outcomes:*\n${outStr || "  None"}`;
        break;
      }

      // ════════════════════════════════════════════════════════
      // BUSINESS MANAGEMENT
      // ════════════════════════════════════════════════════════
      case "/create": {
        const parts = text.replace("/create", "").trim().split(" ");
        const name = parts[0];
        const industry = parts[1] || "restaurant";
        if (!name) { response = "Usage: /create [name] [industry]"; break; }
        const { data, error } = await supabase.from("businesses").insert({
          user_id: userId, name, industry,
          instructions: `You are a professional ${industry} agent for ${name}.`,
        }).select("id,name,industry").single();
        if (error) { response = `❌ ${error.message}`; break; }
        response = `✅ *Business Created*\nName: ${data.name}\nIndustry: ${data.industry}\nID: \`${data.id}\``;
        break;
      }

      case "/delete": {
        const bizName = text.replace("/delete", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business "${bizName}" not found.`; break; }
        await supabase.from("businesses").delete().eq("id", biz.id);
        response = `🗑️ Business *${biz.name}* deleted.`;
        break;
      }

      case "/config": {
        const bizName = text.replace("/config", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        response = `⚙️ *Config: ${biz.name}*\nMode: ${biz.agent_mode}\nVoice: ${biz.voice}\nLLM: ${biz.llm_provider}/${biz.llm_model}\nTTS: ${biz.tts_provider}\nSTT: ${biz.stt_provider}/${biz.stt_model}\nGreeting: ${biz.greeting_message.substring(0, 100)}...\nInstructions: ${biz.instructions.substring(0, 150)}...`;
        break;
      }

      case "/setprompt": {
        const [bizName, ...instrParts] = pipeSplit(text, "/setprompt");
        const instructions = instrParts.join("|").trim();
        if (!bizName || !instructions) { response = "Usage: /setprompt [name] | [instructions]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        await supabase.from("businesses").update({ instructions }).eq("id", biz.id);
        response = `✅ Instructions updated for *${biz.name}*`;
        break;
      }

      case "/setvoice": {
        const parts = text.replace("/setvoice", "").trim().split(" ");
        const bizName = parts[0];
        const voice = parts[1];
        if (!bizName || !voice) { response = "Usage: /setvoice [name] [voice]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        await supabase.from("businesses").update({ voice }).eq("id", biz.id);
        response = `🎙️ Voice changed to *${voice}* for ${biz.name}`;
        break;
      }

      case "/setmode": {
        const parts = text.replace("/setmode", "").trim().split(" ");
        const bizName = parts[0];
        const mode = parts[1];
        if (!bizName || !mode) { response = "Usage: /setmode [name] [receptionist|sales|support]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        await supabase.from("businesses").update({ agent_mode: mode }).eq("id", biz.id);
        response = `🔄 Mode changed to *${mode}* for ${biz.name}`;
        break;
      }

      case "/pause": {
        const bizName = text.replace("/pause", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        await supabase.from("businesses").update({ status: "paused" }).eq("id", biz.id);
        response = `⏸️ Agent paused for *${biz.name}*`;
        break;
      }

      case "/resume": {
        const bizName = text.replace("/resume", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        await supabase.from("businesses").update({ status: "active" }).eq("id", biz.id);
        response = `▶️ Agent resumed for *${biz.name}*`;
        break;
      }

      // ════════════════════════════════════════════════════════
      // CONTACTS & CAMPAIGNS
      // ════════════════════════════════════════════════════════
      case "/addcontact": {
        const [bizName, name, phone] = pipeSplit(text, "/addcontact");
        if (!bizName || !name) { response = "Usage: /addcontact [biz] | [name] | [phone]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data, error } = await supabase.from("contacts").insert({ business_id: biz.id, name, phone: phone || null }).select("id,name").single();
        if (error) { response = `❌ ${error.message}`; break; }
        response = `👤 Contact *${data.name}* added to ${biz.name}`;
        break;
      }

      case "/contacts": {
        const bizName = text.replace("/contacts", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { count } = await supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", biz.id);
        const { data: recent } = await supabase.from("contacts").select("name,phone").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(5);
        response = `📇 *Contacts: ${biz.name}* (${count} total)\n` + (recent?.map(c => `• ${c.name} ${c.phone || ""}`).join("\n") || "None");
        break;
      }

      case "/campaign": {
        const [bizName, name, script] = pipeSplit(text, "/campaign");
        if (!bizName || !name) { response = "Usage: /campaign [biz] | [name] | [script]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data, error } = await supabase.from("campaigns").insert({ business_id: biz.id, name, script: script || "" }).select("id,name").single();
        if (error) { response = `❌ ${error.message}`; break; }
        response = `📢 Campaign *${data.name}* created for ${biz.name}\nID: \`${data.id}\``;
        break;
      }

      case "/startbulk": {
        const parts = text.replace("/startbulk", "").trim().split(" ");
        const bizName = parts[0];
        if (!bizName) { response = "Usage: /startbulk [biz]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data: contacts } = await supabase.from("contacts").select("id,name,phone").eq("business_id", biz.id).not("phone", "is", null).limit(500);
        if (!contacts?.length) { response = `❌ No contacts with phone numbers.`; break; }
        const { data: job, error } = await supabase.from("bulk_call_jobs").insert({
          business_id: biz.id, name: `TG Bulk ${new Date().toLocaleDateString()}`,
          total_contacts: contacts.length, status: "queued",
        }).select("id").single();
        if (error) { response = `❌ ${error.message}`; break; }
        const entries = contacts.map(c => ({ job_id: job.id, business_id: biz.id, contact_name: c.name, contact_phone: c.phone || "", status: "pending" }));
        await supabase.from("bulk_call_entries").insert(entries);
        response = `🚀 Bulk call started for *${biz.name}*\n${contacts.length} contacts queued\nJob ID: \`${job.id}\``;
        break;
      }

      case "/startmarketing": {
        const [bizName, jobType, message] = pipeSplit(text, "/startmarketing");
        if (!bizName || !jobType || !message) { response = "Usage: /startmarketing [biz] | [rvm/sms] | [message]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data: contacts } = await supabase.from("contacts").select("id,name,phone").eq("business_id", biz.id).not("phone", "is", null).limit(500);
        if (!contacts?.length) { response = `❌ No contacts with phone numbers.`; break; }
        const { data: job, error } = await supabase.from("bulk_marketing_jobs").insert({
          business_id: biz.id, name: `TG Marketing ${new Date().toLocaleDateString()}`,
          job_type: jobType, message_content: message, total_contacts: contacts.length, status: "queued",
        }).select("id").single();
        if (error) { response = `❌ ${error.message}`; break; }
        const entries = contacts.map(c => ({ job_id: job.id, business_id: biz.id, contact_name: c.name, contact_phone: c.phone || "", status: "pending" }));
        await supabase.from("bulk_marketing_entries").insert(entries);
        response = `📣 Marketing job (${jobType}) started for *${biz.name}*\n${contacts.length} contacts\nJob ID: \`${job.id}\``;
        break;
      }

      case "/jobstatus": {
        const jobId = text.replace("/jobstatus", "").trim();
        if (!jobId) { response = "Usage: /jobstatus [job_id]"; break; }
        const { data: bcj } = await supabase.from("bulk_call_jobs").select("*").eq("id", jobId).maybeSingle();
        const { data: bmj } = await supabase.from("bulk_marketing_jobs").select("*").eq("id", jobId).maybeSingle();
        const job = bcj || bmj;
        if (!job) { response = `❌ Job not found.`; break; }
        response = `📊 *Job: ${job.name}*\nStatus: ${job.status}\nTotal: ${job.total_contacts}\n✅ Completed: ${job.completed}\n❌ Failed: ${job.failed}\n🔄 In Progress: ${job.in_progress}`;
        break;
      }

      case "/pausejob": {
        const jobId = text.replace("/pausejob", "").trim();
        if (!jobId) { response = "Usage: /pausejob [job_id]"; break; }
        await supabase.from("bulk_call_jobs").update({ status: "paused" }).eq("id", jobId);
        await supabase.from("bulk_marketing_jobs").update({ status: "paused" }).eq("id", jobId);
        response = `⏸️ Job paused: \`${jobId}\``;
        break;
      }

      case "/canceljob": {
        const jobId = text.replace("/canceljob", "").trim();
        if (!jobId) { response = "Usage: /canceljob [job_id]"; break; }
        await supabase.from("bulk_call_jobs").update({ status: "cancelled" }).eq("id", jobId);
        await supabase.from("bulk_marketing_jobs").update({ status: "cancelled" }).eq("id", jobId);
        response = `🛑 Job cancelled: \`${jobId}\``;
        break;
      }

      // ════════════════════════════════════════════════════════
      // PHONE & IVR
      // ════════════════════════════════════════════════════════
      case "/ivrcreate": {
        const [bizName, template] = pipeSplit(text, "/ivrcreate");
        if (!bizName) { response = "Usage: /ivrcreate [biz] | [template]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data, error } = await supabase.from("ivr_menus").insert({
          business_id: biz.id, name: `${biz.name} IVR`,
          template_type: template || "basic", greeting_text: `Thank you for calling ${biz.name}. Press 1 for sales, 2 for support.`,
        }).select("id,name").single();
        if (error) { response = `❌ ${error.message}`; break; }
        response = `📞 IVR menu *${data.name}* created\nID: \`${data.id}\``;
        break;
      }

      case "/assignnumber": {
        const parts = text.replace("/assignnumber", "").trim().split(" ");
        const numberId = parts[0];
        const handler = parts[1] || "ai_agent";
        if (!numberId) { response = "Usage: /assignnumber [number_id] [handler]"; break; }
        const { error } = await supabase.from("phone_numbers").update({ assigned_handler_type: handler }).eq("id", numberId);
        if (error) { response = `❌ ${error.message}`; break; }
        response = `✅ Number assigned to *${handler}*`;
        break;
      }

      // ════════════════════════════════════════════════════════
      // INTELLIGENCE & DATA
      // ════════════════════════════════════════════════════════
      case "/transcript": {
        const callId = text.replace("/transcript", "").trim();
        if (!callId) { response = "Usage: /transcript [call_id]"; break; }
        const { data } = await supabase.from("call_logs").select("transcript,caller_name,duration_seconds").eq("id", callId).single();
        if (!data?.transcript) { response = `❌ No transcript found.`; break; }
        const t = data.transcript.length > 3500 ? data.transcript.substring(0, 3500) + "..." : data.transcript;
        response = `📝 *Transcript* (${data.caller_name || "Unknown"}, ${data.duration_seconds || 0}s)\n\n${t}`;
        break;
      }

      case "/dnc": {
        const parts = text.replace("/dnc", "").trim().split(" ");
        const op = parts[0]; // add or remove
        const bizName = parts[1];
        const phone = parts[2];
        if (!op || !bizName || !phone) { response = "Usage: /dnc [add/remove] [biz] [phone]"; break; }
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        if (op === "add") {
          await supabase.from("dnc_list").insert({ business_id: biz.id, phone_number: phone, reason: "Added via Telegram" });
          response = `🚫 ${phone} added to DNC for ${biz.name}`;
        } else {
          await supabase.from("dnc_list").delete().eq("business_id", biz.id).eq("phone_number", phone);
          response = `✅ ${phone} removed from DNC for ${biz.name}`;
        }
        break;
      }

      case "/webhooks": {
        const bizName = text.replace("/webhooks", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data } = await supabase.from("webhooks").select("url,events,is_active").eq("business_id", biz.id).limit(10);
        if (!data?.length) { response = `🔗 No webhooks for ${biz.name}.`; break; }
        response = `🔗 *Webhooks: ${biz.name}*\n` + data.map(w => `• ${w.url} (${w.is_active ? "✅" : "❌"}) — ${(w.events as string[])?.join(", ")}`).join("\n");
        break;
      }

      case "/experiments": {
        const bizName = text.replace("/experiments", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data } = await supabase.from("ab_tests").select("name,status,traffic_split,winner").eq("business_id", biz.id).limit(10);
        if (!data?.length) { response = `🧪 No experiments for ${biz.name}.`; break; }
        response = `🧪 *Experiments: ${biz.name}*\n` + data.map(e => `• ${e.name}: ${e.status} (${e.traffic_split}% split)${e.winner ? ` Winner: ${e.winner}` : ""}`).join("\n");
        break;
      }

      case "/profiles": {
        const bizName = text.replace("/profiles", "").trim();
        const biz = await findBiz(bizName);
        if (!biz) { response = `❌ Business not found.`; break; }
        const { data } = await supabase.from("customer_profiles").select("name,lead_score,lead_status,total_calls").eq("business_id", biz.id).order("lead_score", { ascending: false }).limit(10);
        if (!data?.length) { response = `👥 No profiles for ${biz.name}.`; break; }
        response = `👥 *Top Profiles: ${biz.name}*\n` + data.map(p => `• ${p.name} — Score: ${p.lead_score} (${p.lead_status}) ${p.total_calls} calls`).join("\n");
        break;
      }

      case "/sla": {
        const { data: alerts } = await supabase.from("sla_alerts").select("*, businesses(name)").eq("acknowledged", false).order("created_at", { ascending: false }).limit(5);
        if (!alerts?.length) { response = "✅ No SLA violations."; break; }
        response = "🚨 *SLA Violations*\n" + alerts.map((a: any) => `• ${a.businesses?.name || "?"}: ${a.message}`).join("\n");
        break;
      }

      case "/bookings": {
        const today = new Date().toISOString().split("T")[0];
        const { data: bookings } = await supabase.from("reservations").select("*").eq("date", today).limit(10);
        if (!bookings?.length) { response = "📅 No bookings today."; break; }
        response = `📅 *Today's Bookings (${bookings.length})*\n` + bookings.map(b => `• ${b.name} — ${b.time} (${b.guests} guests)`).join("\n");
        break;
      }

      case "/leads": {
        const { data: leads } = await supabase.from("customer_profiles").select("*, businesses(name)").gte("lead_score", 70).order("lead_score", { ascending: false }).limit(10);
        if (!leads?.length) { response = "🔥 No hot leads found."; break; }
        response = "🔥 *Hot Leads*\n" + leads.map((l: any) => `• ${l.name} (Score: ${l.lead_score}) — ${l.businesses?.name || "?"}`).join("\n");
        break;
      }

      case "/bulk": {
        const parts = text.split(" ");
        if (parts[1] === "status") {
          const { data: jobs } = await supabase.from("bulk_call_jobs").select("*").in("status", ["queued", "running"]).limit(5);
          if (!jobs?.length) { response = "📊 No active bulk jobs."; break; }
          response = "📊 *Active Bulk Jobs*\n" + jobs.map(j => `• ${j.name}: ${j.completed}/${j.total_contacts} (${j.status})`).join("\n");
        } else {
          response = "Usage: /bulk status";
        }
        break;
      }

      // ════════════════════════════════════════════════════════
      // HELP
      // ════════════════════════════════════════════════════════
      case "/help":
      case "/start":
      default: {
        response = `🤖 *AgentHub Bot — Full Control*

📊 *Monitoring*
/status — Platform overview
/calls — Today's calls
/report [name] — Business report
/analytics [name] — 7-day analytics
/sla — SLA violations
/bookings — Today's bookings
/leads — Hot leads
/bulk status — Active bulk jobs

🏢 *Business Management*
/create [name] [industry] — Create business
/delete [name] — Delete business
/config [name] — View config
/setprompt [name] | [instructions] — Set prompt
/setvoice [name] [voice] — Change voice
/setmode [name] [mode] — Change mode
/pause [name] — Pause agent
/resume [name] — Resume agent

👤 *Contacts & Campaigns*
/addcontact [biz] | [name] | [phone]
/contacts [biz] — List contacts
/campaign [biz] | [name] | [script]
/startbulk [biz] — Start bulk calls
/startmarketing [biz] | [type] | [msg]
/jobstatus [id] — Job progress
/pausejob [id] — Pause job
/canceljob [id] — Cancel job

📞 *Phone & IVR*
/ivrcreate [biz] | [template]
/assignnumber [id] [handler]

🔍 *Intelligence*
/transcript [call_id] — Get transcript
/dnc [add/remove] [biz] [phone]
/webhooks [biz] — List webhooks
/experiments [biz] — A/B tests
/profiles [biz] — Customer profiles`;
        break;
      }
    }

    // Log command
    await supabase.from("telegram_commands_log").insert({ user_id: userId, command: text, response_summary: response.substring(0, 200) }).catch(() => {});

    // Send response
    if (botToken && response) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: "Markdown" }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Helper to send telegram message when no bot token is in config yet
async function sendTg(_token: string | null, chatId: number, text: string, _body: any) {
  // Can't send without a token - this is a no-op fallback
}
