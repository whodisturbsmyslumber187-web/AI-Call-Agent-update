import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Handle Telegram webhook updates
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();
      const command = text.split(" ")[0].toLowerCase();

      let response = "";

      // Find user by chat_id
      const { data: config } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("chat_id", chatId.toString())
        .eq("is_active", true)
        .single();

      if (!config) {
        response = "⚠️ This chat is not linked to any AgentHub account. Set your chat ID in Settings.";
      } else {
        const userId = config.user_id;

        switch (command) {
          case "/status": {
            const { count: businessCount } = await supabase.from("businesses").select("*", { count: "exact", head: true }).eq("user_id", userId);
            const { count: activeCalls } = await supabase.from("call_logs").select("*", { count: "exact", head: true }).is("ended_at", null);
            const { count: queueCount } = await supabase.from("call_queue").select("*", { count: "exact", head: true }).eq("status", "waiting");
            response = `📊 *Platform Status*\n🏢 Businesses: ${businessCount}\n📞 Active Calls: ${activeCalls}\n⏳ In Queue: ${queueCount}`;
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
            const { data: biz } = await supabase.from("businesses").select("*").eq("user_id", userId).ilike("name", `%${bizName}%`).limit(1).single();
            if (!biz) { response = `❌ Business "${bizName}" not found.`; break; }
            const today = new Date().toISOString().split("T")[0];
            const { count: todayCalls } = await supabase.from("call_logs").select("*", { count: "exact", head: true }).eq("business_id", biz.id).gte("started_at", today + "T00:00:00Z");
            const { count: totalContacts } = await supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", biz.id);
            response = `📋 *Report: ${biz.name}*\nStatus: ${biz.status}\nMode: ${biz.agent_mode}\nToday's Calls: ${todayCalls}\nTotal Contacts: ${totalContacts}`;
            break;
          }

          case "/pause": {
            const pauseName = text.replace("/pause", "").trim();
            const { data: biz } = await supabase.from("businesses").select("id, name").eq("user_id", userId).ilike("name", `%${pauseName}%`).limit(1).single();
            if (!biz) { response = `❌ Business "${pauseName}" not found.`; break; }
            await supabase.from("businesses").update({ status: "paused" }).eq("id", biz.id);
            response = `⏸️ Agent paused for *${biz.name}*`;
            break;
          }

          case "/resume": {
            const resumeName = text.replace("/resume", "").trim();
            const { data: biz } = await supabase.from("businesses").select("id, name").eq("user_id", userId).ilike("name", `%${resumeName}%`).limit(1).single();
            if (!biz) { response = `❌ Business "${resumeName}" not found.`; break; }
            await supabase.from("businesses").update({ status: "active" }).eq("id", biz.id);
            response = `▶️ Agent resumed for *${biz.name}*`;
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

          case "/sla": {
            const { data: alerts } = await supabase.from("sla_alerts").select("*, businesses(name)").eq("acknowledged", false).order("created_at", { ascending: false }).limit(5);
            if (!alerts?.length) { response = "✅ No SLA violations."; break; }
            response = "🚨 *SLA Violations*\n" + alerts.map((a: any) => `• ${a.businesses?.name || "?"}: ${a.message}`).join("\n");
            break;
          }

          case "/help":
          default: {
            response = `🤖 *AgentHub Bot Commands*\n/status — Platform overview\n/calls — Today's calls\n/report [name] — Business report\n/pause [name] — Pause agent\n/resume [name] — Resume agent\n/bulk status — Bulk job status\n/bookings — Today's bookings\n/leads — Hot leads\n/sla — SLA violations`;
            break;
          }
        }

        // Log command
        await supabase.from("telegram_commands_log").insert({ user_id: userId, command: text, response_summary: response.substring(0, 200) });

        // Send response via Telegram
        const botToken = Deno.env.get(config.bot_token_secret_name) || "";
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: "Markdown" }),
          });
        }
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle notification sending (called internally)
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

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
