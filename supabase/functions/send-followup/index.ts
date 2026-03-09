import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_id, trigger_event, recipient_phone, recipient_email, variables } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get matching active templates
    const { data: templates } = await supabase
      .from("message_templates")
      .select("*")
      .eq("business_id", business_id)
      .eq("trigger_event", trigger_event)
      .eq("is_active", true);

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ message: "No active templates for this trigger" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const template of templates) {
      // Replace variables in template
      let text = template.template_text;
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          text = text.replace(new RegExp(`\\{${key}\\}`, "g"), value as string);
        }
      }

      // Log the follow-up attempt (actual SMS/WhatsApp sending would require Twilio/etc integration)
      console.log(`[${template.channel}] To: ${recipient_phone || recipient_email} | Message: ${text}`);
      
      results.push({
        channel: template.channel,
        recipient: recipient_phone || recipient_email,
        message: text,
        status: "queued",
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
