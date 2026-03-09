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
      const { data: job } = await supabase.from("bulk_call_jobs").select("business_id, businesses!inner(user_id)").eq("id", job_id).single();
      if (!job || (job as any).businesses?.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (action === "start") {
      await supabase.from("bulk_call_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job_id);

      const { data: job } = await supabase.from("bulk_call_jobs").select("*").eq("id", job_id).single();
      if (!job) throw new Error("Job not found");

      const { data: entries } = await supabase
        .from("bulk_call_entries")
        .select("*")
        .eq("job_id", job_id)
        .eq("status", "pending")
        .limit(job.concurrency_limit);

      if (!entries?.length) {
        await supabase.from("bulk_call_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job_id);
        return new Response(JSON.stringify({ message: "No pending entries, job completed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const entryIds = entries.map(e => e.id);
      await supabase.from("bulk_call_entries").update({ status: "dialing", last_attempt_at: new Date().toISOString() }).in("id", entryIds);
      await supabase.from("bulk_call_jobs").update({ in_progress: entryIds.length }).eq("id", job_id);

      for (const entry of entries) {
        const isSuccess = Math.random() > 0.3;
        const duration = isSuccess ? Math.floor(Math.random() * 180) + 30 : 0;
        
        await supabase.from("bulk_call_entries").update({
          status: isSuccess ? "completed" : "failed",
          attempt_count: entry.attempt_count + 1,
          duration_seconds: duration,
          outcome: isSuccess ? "connected" : "no_answer",
        }).eq("id", entry.id);
      }

      const { count: completedCount } = await supabase.from("bulk_call_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "completed");
      const { count: failedCount } = await supabase.from("bulk_call_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "failed");
      const { count: pendingCount } = await supabase.from("bulk_call_entries").select("*", { count: "exact", head: true }).eq("job_id", job_id).eq("status", "pending");

      const isComplete = (pendingCount || 0) === 0;
      await supabase.from("bulk_call_jobs").update({
        completed: completedCount || 0,
        failed: failedCount || 0,
        in_progress: 0,
        status: isComplete ? "completed" : "running",
        ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
      }).eq("id", job_id);

      return new Response(JSON.stringify({ message: "Batch processed", completed: completedCount, failed: failedCount, remaining: pendingCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "pause") {
      await supabase.from("bulk_call_jobs").update({ status: "paused" }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Job paused" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cancel") {
      await supabase.from("bulk_call_jobs").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Job cancelled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "retry_failed") {
      await supabase.from("bulk_call_entries").update({ status: "pending" }).eq("job_id", job_id).eq("status", "failed").lt("attempt_count", 3);
      await supabase.from("bulk_call_jobs").update({ status: "queued" }).eq("id", job_id);
      return new Response(JSON.stringify({ message: "Failed entries re-queued" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
