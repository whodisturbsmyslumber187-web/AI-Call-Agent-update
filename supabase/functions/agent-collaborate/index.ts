import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_id, action } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get approved learnings from this business
    const { data: learnings } = await supabase
      .from("agent_learnings")
      .select("*")
      .eq("business_id", business_id)
      .eq("status", "approved")
      .order("confidence", { ascending: false })
      .limit(20);

    if (!learnings || learnings.length === 0) {
      return new Response(JSON.stringify({ message: "No approved learnings to share" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get business info
    const { data: business } = await supabase
      .from("businesses")
      .select("name, industry")
      .eq("id", business_id)
      .single();

    const learningsSummary = learnings.map(l => `[${l.category}] "${l.trigger_phrase}" → "${l.learned_response}" (confidence: ${l.confidence})`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an AI agent collaboration coordinator. Summarize learnings into actionable tips that other agents can use. Be concise and practical. Return 2-3 key insights." },
          { role: "user", content: `Agent for "${business?.name}" (${business?.industry}) has these learnings:\n${learningsSummary}\n\nCreate shareable tips for other agents.` },
        ],
      }),
    });

    if (!response.ok) throw new Error("AI collaboration failed");

    const result = await response.json();
    const tipMessage = result.choices?.[0]?.message?.content || "No insights generated";

    // Post as broadcast message
    const { error } = await supabase.from("agent_chat_messages").insert({
      from_business_id: business_id,
      to_business_id: null,
      message: tipMessage,
      message_type: "insight",
    });

    if (error) console.error("Insert error:", error);

    return new Response(JSON.stringify({ message: tipMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
