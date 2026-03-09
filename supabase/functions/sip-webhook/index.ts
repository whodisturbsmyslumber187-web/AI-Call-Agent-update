import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { phoneNumber, callSid, direction, from, to } = body;

    // Determine target phone number for routing
    const targetNumber = direction === "inbound" ? to : from;

    // Find the business associated with this phone number
    const { data: phoneRecord, error: phoneErr } = await supabase
      .from("phone_numbers")
      .select("business_id, businesses(id, name, livekit_enabled, livekit_room_prefix)")
      .eq("phone_number", targetNumber || phoneNumber)
      .eq("status", "active")
      .limit(1)
      .single();

    if (phoneErr || !phoneRecord) {
      console.error("No business found for number:", targetNumber || phoneNumber);
      return new Response(
        JSON.stringify({ error: "No business configured for this number", routed: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const business = phoneRecord.businesses as any;

    // Log the call
    const { data: callLog, error: logErr } = await supabase
      .from("call_logs")
      .insert({
        business_id: phoneRecord.business_id,
        direction: direction || "inbound",
        caller_number: from || phoneNumber,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (logErr) {
      console.error("Failed to log call:", logErr);
    }

    // If LiveKit is enabled, generate a room token for the agent
    let livekitRoom = null;
    if (business?.livekit_enabled && LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL) {
      const roomPrefix = business.livekit_room_prefix || business.name.toLowerCase().replace(/\s+/g, "-");
      livekitRoom = {
        name: `${roomPrefix}-${crypto.randomUUID().slice(0, 8)}`,
        url: LIVEKIT_URL,
      };
    }

    return new Response(
      JSON.stringify({
        routed: true,
        businessId: phoneRecord.business_id,
        businessName: business?.name,
        callLogId: callLog?.id,
        livekitRoom,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("SIP webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
