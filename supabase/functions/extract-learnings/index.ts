import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const { call_log_id, business_id, transcript } = await req.json();
    if (!transcript || !business_id) {
      return new Response(JSON.stringify({ error: "Missing transcript or business_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify business ownership
    const { data: biz } = await supabase.from("businesses").select("id,user_id").eq("id", business_id).single();
    if (!biz || biz.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `Analyze this call transcript and extract learnings. Return a JSON array of objects with: category (faq|objection|preference), trigger_phrase, learned_response, confidence (0-1). Only include genuinely useful learnings.` },
          { role: "user", content: transcript },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_learnings",
            description: "Extract learnings from a call transcript",
            parameters: {
              type: "object",
              properties: {
                learnings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["faq", "objection", "preference"] },
                      trigger_phrase: { type: "string" },
                      learned_response: { type: "string" },
                      confidence: { type: "number" }
                    },
                    required: ["category", "trigger_phrase", "learned_response", "confidence"]
                  }
                }
              },
              required: ["learnings"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_learnings" } }
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ learnings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { learnings } = JSON.parse(toolCall.function.arguments);

    const rows = learnings.map((l: any) => ({
      business_id,
      category: l.category,
      trigger_phrase: l.trigger_phrase,
      learned_response: l.learned_response,
      source: "call",
      confidence: l.confidence,
      status: "pending",
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("agent_learnings").insert(rows);
      if (error) console.error("Insert error:", error);
    }

    return new Response(JSON.stringify({ learnings: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
