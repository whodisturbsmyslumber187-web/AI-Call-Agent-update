import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth check ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, job_id } = await req.json();

    // Verify job ownership
    if (job_id) {
      const { data: job } = await supabase.from("bulk_marketing_jobs").select("business_id, businesses!inner(user_id)").eq("id", job_id).single();
      if (!job || (job as any).businesses?.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (action === "start") {
      await supabase.from("bulk_marketing_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job_id);

      const { data: job } = await supabase.from("bulk_marketing_jobs").select("*").eq("id", job_id).single();
      if (!job) throw new Error("Job not found");

      const { data: entries } = await supabase
        .from("bulk_marketing_entries")
        .select("*")
        .eq("job_id", job_id)
        .eq("status", "pending")
        .limit(job.concurrency_limit);

      if (!entries?.length) {
        await supabase.from("bulk_marketing_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job_id);
        return new Response(JSON.stringify({ message: "No pending entries, job completed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const entryIds = entries.map(e => e.id);
      await supabase.from("bulk_marketing_entries").update({ status: "processing", attempt_count: 1 }).in("id", entryIds);
      await supabase.from("bulk_marketing_jobs").update({ in_progress: entryIds.length }).eq("id", job_id);

      for (const entry of entries) {
        let status = "delivered";
        let deliveryResult = "sent";

        switch (job.job_type) {
          case "rvm": {
            const rvmSuccess = Math.random() > 0.15;
            status = rvmSuccess ? "delivered" : "failed";
            deliveryResult = rvmSuccess ? "voicemail_delivered" : (Math.random() > 0.5 ? "voicemail_full" : "carrier_blocked");
            break;
          }
          case "one_ring": {
            const ringSuccess = Math.random() > 0.1;
            const gotCallback = ringSuccess && Math.random() > 0.7;
            status = ringSuccess ? (gotCallback ? "callback_received" : "delivered") : "failed";
            deliveryResult = ringSuccess ? `rang_${job.ring_count}_times` : "invalid_number";
            break;
          }
          case "bulk_sms": {
            const smsSuccess = Math.random() > 0.08;
            status = smsSuccess ? "delivered" : "failed";
            deliveryResult = smsSuccess ? "sent" : (Math.random() > 0.5 ? "invalid_number" : "carrier_blocked");
            break;
          }
          case "press_1": {
            const answered = Math.random() > 0.4;
            const pressed1 = answered && Math.random() > 0.6;
            status = answered ? "delivered" : "failed";
            deliveryResult = pressed1 ? "pressed_1_transferred" : (answered ? "listened_no_press" : "no_answer");
            break;
          }
          case "speed_to_lead": {
            const connected = Math.random() > 0.3;
            status = connected ? "delivered" : "failed";
            deliveryResult = connected ? "lead_connected" : "no_answer";
            break;
          }
        }

        await supabase.from("bulk_marketing_entries").update({
          status,
          delivery_result: deliveryResult,
          ...(status === "callback_received" ? { callback_at: new Date().toISOString() } : {}),
          ...(job.job_type === "bulk_sms" && status === "delivered" ? { sms_sid: `SM${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}` } : {}),
        }).eq("id", entry.id);
      }

      const { count: completedCount } = await supabase.from("bulk_marketing_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "delivered");
      const { count: callbackCount } = await supabase.from("bulk_marketing_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "callback_received");
      const { count: failedCount } = await supabase.from("bulk_marketing_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "failed");
      const { count: pendingCount } = await supabase.from("bulk_marketing_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "pending");

      const totalCompleted = (completedCount || 0) + (callbackCount || 0);
      const isComplete = (pendingCount || 0) === 0;

      await supabase.from("bulk_marketing_jobs").update({
        completed: totalCompleted,
        failed: failedCount || 0,
        in_progress: 0,
        status: isComplete ? "completed" : "running",
        ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
      }).eq("id", job_id);

      return new Response(JSON.stringify({ message: "Batch processed", completed: totalCompleted, failed: failedCount, remaining: pendingCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "pause") {
      await supabase.from("bulk_marketing_jobs").update({ status: "paused" }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Job paused" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cancel") {
      await supabase.from("bulk_marketing_jobs").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Job cancelled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "retry_failed") {
      await supabase.from("bulk_marketing_entries").update({ status: "pending", delivery_result: null }).eq("job_id", job_id).eq("status", "failed");
      await supabase.from("bulk_marketing_jobs").update({ status: "queued" }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Failed entries re-queued" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
