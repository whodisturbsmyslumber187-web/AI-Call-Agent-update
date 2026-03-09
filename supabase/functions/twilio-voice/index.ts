import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { validateReservation } from "../_shared/validation.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface BusinessConfig {
  id: string;
  name: string;
  instructions: string;
  knowledge_base: string;
  greeting_message: string;
  voice: string;
  industry: string;
}

async function lookupBusinessByPhone(phoneNumber: string): Promise<BusinessConfig | null> {
  const { data } = await supabase
    .from("phone_numbers")
    .select("business_id, businesses(*)")
    .eq("phone_number", phoneNumber)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (data?.businesses) {
    const b = data.businesses as any;
    return {
      id: b.id,
      name: b.name,
      instructions: b.instructions,
      knowledge_base: b.knowledge_base,
      greeting_message: b.greeting_message,
      voice: b.voice,
      industry: b.industry,
    };
  }
  return null;
}

async function getFallbackConfig(): Promise<BusinessConfig> {
  try {
    const { data: config } = await supabase
      .from("agent_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (config) {
      return {
        id: "",
        name: config.restaurant_name,
        instructions: `You are a receptionist for ${config.restaurant_name}.\nHours: ${config.restaurant_hours}\nMenu: ${config.menu}\n${config.instructions}`,
        knowledge_base: "",
        greeting_message: "Please wait while I connect you to our AI receptionist",
        voice: "alloy",
        industry: "restaurant",
      };
    }
  } catch (e) {
    console.error("Failed to load fallback config:", e);
  }

  return {
    id: "",
    name: "Business",
    instructions: "You are a helpful receptionist.",
    knowledge_base: "",
    greeting_message: "Please wait while I connect you to our AI receptionist",
    voice: "alloy",
    industry: "general",
  };
}

function buildInstructions(biz: BusinessConfig): string {
  let text = `You are a professional receptionist for ${biz.name}.\n\n`;
  text += biz.instructions + "\n\n";
  if (biz.knowledge_base) {
    text += `Here is important information you should know:\n${biz.knowledge_base}\n\n`;
  }
  text += `When a customer wants to make a reservation or appointment, collect their name, email, date, time, and number of guests/attendees. Once you have all information, use the create_reservation function to book it.`;
  return text;
}

serve(async (req) => {
  const url = new URL(req.url);
  console.log("Request received:", url.pathname);

  // ===== ENDPOINT: /twiml =====
  if (url.pathname.endsWith("/twiml")) {
    // Extract called number from Twilio POST params
    let calledNumber = "";
    let greetingMessage = "Please wait while I connect you to our AI receptionist";

    try {
      const formData = await req.clone().formData();
      calledNumber = formData.get("Called")?.toString() || formData.get("To")?.toString() || "";
    } catch {
      // GET request or no form data
      calledNumber = url.searchParams.get("Called") || url.searchParams.get("To") || "";
    }

    if (calledNumber) {
      const biz = await lookupBusinessByPhone(calledNumber);
      if (biz) greetingMessage = biz.greeting_message;
    }

    const wsUrl = `wss://${url.host}/functions/v1/twilio-voice/media-stream${calledNumber ? `?called=${encodeURIComponent(calledNumber)}` : ""}`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${greetingMessage}</Say>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;

    console.log("Returning TwiML for number:", calledNumber);
    return new Response(twiml, {
      headers: {
        "Content-Type": "application/xml",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // ===== ENDPOINT: /media-stream (WebSocket) =====
  if (url.pathname.endsWith("/media-stream")) {
    console.log("Upgrading to WebSocket");
    const calledNumber = url.searchParams.get("called") || "";

    const { socket: twilioSocket, response } = Deno.upgradeWebSocket(req);

    let openaiSocket: WebSocket | null = null;
    let streamSid: string | null = null;
    let conversationId: string | null = null;
    let businessConfig: BusinessConfig | null = null;
    const fnArgs: Record<string, string> = {};

    const connectOpenAI = async () => {
      if (openaiSocket) return;

      // Look up business config
      if (calledNumber) {
        businessConfig = await lookupBusinessByPhone(calledNumber);
      }
      if (!businessConfig) {
        businessConfig = await getFallbackConfig();
      }

      console.log(`🔌 Connecting to OpenAI for business: ${businessConfig.name}`);
      openaiSocket = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
      );

      openaiSocket.onopen = () => {
        console.log("✅ OpenAI WebSocket connected");
      };

      openaiSocket.onmessage = async (event) => {
        const resp = JSON.parse(event.data);

        if (resp.type !== "response.audio.delta" && resp.type !== "input_audio_buffer.speech_started") {
          console.log("🤖 OpenAI event:", resp.type);
        }

        if (resp.type === "session.created") {
          const instructionsText = buildInstructions(businessConfig!);

          openaiSocket!.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: instructionsText,
              voice: businessConfig!.voice || "alloy",
              input_audio_format: "g711_ulaw",
              output_audio_format: "g711_ulaw",
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000,
              },
              temperature: 0.8,
              tools: [{
                type: "function",
                name: "create_reservation",
                description: "Create a reservation/appointment with customer details",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Customer name" },
                    email: { type: "string", description: "Customer email address" },
                    date: { type: "string", description: "Reservation date in YYYY-MM-DD format" },
                    time: { type: "string", description: "Reservation time in HH:MM format" },
                    guests: { type: "number", description: "Number of guests/attendees" },
                  },
                  required: ["name", "email", "date", "time", "guests"],
                  additionalProperties: false,
                },
              }],
              tool_choice: "auto",
            },
          }));
        }

        if (resp.type === "response.audio.delta" && streamSid) {
          twilioSocket.send(JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: resp.delta },
          }));
        }

        if (resp.type === "response.function_call_arguments.delta") {
          const { call_id, delta } = resp;
          fnArgs[call_id] = (fnArgs[call_id] || "") + delta;
        }

        if (resp.type === "response.function_call_arguments.done") {
          try {
            const { call_id } = resp;
            const argsStr = fnArgs[call_id] || resp.arguments || "{}";
            delete fnArgs[call_id];
            const rawArgs = JSON.parse(argsStr);

            const validation = validateReservation({
              ...rawArgs,
              guests: Number(rawArgs.guests) || 0,
            });

            if (!validation.success) {
              openaiSocket!.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id,
                  output: JSON.stringify({ success: false, error: `Invalid: ${validation.errors.join(", ")}` }),
                },
              }));
              openaiSocket!.send(JSON.stringify({ type: "response.create" }));
              return;
            }

            const args = validation.data;
            const insertPayload: Record<string, unknown> = {
              date: args.date,
              time: args.time.length === 5 ? args.time + ":00" : args.time,
              guests: args.guests,
              name: args.name,
              email: args.email,
              status: "confirmed",
            };
            if (conversationId) insertPayload.conversation_id = conversationId;
            if (businessConfig?.id) insertPayload.business_id = businessConfig.id;

            const { data: resv, error: resvErr } = await supabase
              .from("reservations")
              .insert(insertPayload)
              .select("*")
              .maybeSingle();

            if (resvErr) {
              console.error("❌ Failed to create reservation:", resvErr);
            } else {
              console.log("✅ Reservation stored:", resv?.id);
              try {
                await supabase.functions.invoke("send-reservation-confirmation", {
                  body: {
                    name: args.name,
                    email: args.email,
                    date: args.date,
                    time: args.time,
                    guests: args.guests,
                    restaurantName: businessConfig?.name || "Business",
                  },
                });
              } catch (emailErr) {
                console.error("⚠️ Failed to send email:", emailErr);
              }
            }

            openaiSocket!.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id,
                output: JSON.stringify({ success: true, message: "Reservation created successfully" }),
              },
            }));
            openaiSocket!.send(JSON.stringify({ type: "response.create" }));
          } catch (e) {
            console.error("❌ Error handling tool call:", e);
          }
        }

        if (resp.type === "error") {
          console.error("❌ OpenAI error:", resp.error);
        }
      };

      openaiSocket.onerror = (error: Event) => {
        console.error("❌ OpenAI WebSocket error:", error);
      };

      openaiSocket.onclose = (event: CloseEvent) => {
        console.log("🔴 OpenAI WebSocket closed:", event.code, event.reason);
      };
    };

    twilioSocket.onopen = () => {
      console.log("✅ Twilio WebSocket connected");
    };

    twilioSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "start") {
          streamSid = data.start.streamSid;
          console.log("📞 Stream started:", streamSid);

          try {
            const insertData: Record<string, unknown> = { status: "active" };
            if (businessConfig?.id) insertData.business_id = businessConfig.id;

            const { data: conv, error: convErr } = await supabase
              .from("conversations")
              .insert(insertData)
              .select("id")
              .maybeSingle();
            if (!convErr && conv?.id) {
              conversationId = conv.id;
              console.log("🗂️ Conversation created:", conversationId);
            }
          } catch (e) {
            console.error("❌ Error creating conversation:", e);
          }

          await connectOpenAI();
        }

        if (data.event === "media" && !openaiSocket) {
          if (!streamSid && data.streamSid) streamSid = data.streamSid;
          await connectOpenAI();
        }

        if (data.event === "media" && openaiSocket?.readyState === WebSocket.OPEN) {
          openaiSocket.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data.media.payload,
          }));
        }

        if (data.event === "stop") {
          console.log("📞 Stream stopped");
          if (conversationId) {
            await supabase
              .from("conversations")
              .update({ status: "completed", ended_at: new Date().toISOString() })
              .eq("id", conversationId);
          }
          openaiSocket?.close();
        }
      } catch (error) {
        console.error("Error handling Twilio message:", error);
      }
    };

    twilioSocket.onerror = (error) => {
      console.error("❌ Twilio WebSocket error:", error);
    };

    twilioSocket.onclose = () => {
      console.log("📞 Twilio disconnected");
      openaiSocket?.close();
    };

    return response;
  }

  return new Response("Multi-Agent Voice Platform - Use /twiml or /media-stream", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
});
