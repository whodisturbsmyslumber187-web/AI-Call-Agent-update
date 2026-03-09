import { supabase } from "@/integrations/supabase/client";
import { validateReservationData } from "@/lib/validations";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private conversationId: string | null = null;

  constructor(
    private onMessage: (message: Record<string, unknown>) => void,
    private onTranscript?: (text: string, role: "user" | "assistant") => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init() {
    try {
      // Create conversation record
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ status: 'active' })
        .select('id')
        .single();

      if (convErr) throw convErr;
      this.conversationId = conv.id;
      console.log('Conversation created:', this.conversationId);

      // Get ephemeral token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("realtime-session");

      if (tokenError || !tokenData?.client_secret?.value) {
        console.error("Token error:", tokenError, tokenData);
        throw new Error("Failed to get ephemeral token. Make sure OPENAI_API_KEY is configured.");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");

      this.dc.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event.type);
        this.onMessage(event);

        // Handle session.created - send configuration
        if (event.type === 'session.created') {
          const { data: config } = await supabase
            .from('agent_config')
            .select('*')
            .limit(1)
            .maybeSingle();

          const instructions = config 
            ? `You are a receptionist for ${config.restaurant_name}.
Hours: ${config.restaurant_hours}
Menu: ${config.menu}
${config.instructions}

When a customer wants to make a reservation, collect their name, email, date, time, and number of guests. Once you have all information, use the create_reservation function to book it.`
            : "You are a helpful restaurant receptionist.";

          this.dc!.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: instructions,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: { model: 'whisper-1' },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: 'function',
                  name: 'create_reservation',
                  description: 'Create a restaurant reservation',
                  parameters: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Customer name' },
                      email: { type: 'string', description: 'Customer email address' },
                      date: { type: 'string', description: 'Reservation date in YYYY-MM-DD format' },
                      time: { type: 'string', description: 'Reservation time in HH:MM format' },
                      guests: { type: 'number', description: 'Number of guests' }
                    },
                    required: ['name', 'email', 'date', 'time', 'guests']
                  }
                }
              ],
              tool_choice: 'auto',
              temperature: 0.8
            }
          }));
        }

        // Handle transcripts
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          this.onTranscript?.(event.transcript, 'user');
        }

        if (event.type === 'response.audio_transcript.done') {
          this.onTranscript?.(event.transcript, 'assistant');
        }

        // Handle function calls
        if (event.type === 'response.function_call_arguments.done') {
          const rawArgs = JSON.parse(event.arguments);
          console.log("Function call:", rawArgs);

          // Validate reservation data client-side before sending to server
          const validation = validateReservationData({
            name: rawArgs.name,
            email: rawArgs.email,
            date: rawArgs.date,
            time: rawArgs.time,
            guests: Number(rawArgs.guests) || 0,
          });

          if (!validation.success) {
            console.error("Validation failed:", validation.error);
            // Send error back to OpenAI
            this.dc!.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: event.call_id,
                output: JSON.stringify({ 
                  success: false, 
                  error: `Invalid reservation data: ${validation.error}` 
                })
              }
            }));
            this.dc!.send(JSON.stringify({ type: 'response.create' }));
            return;
          }

          const args = validation.data!;

          // Save reservation with validated data
          const { data: resv, error: resvErr } = await supabase
            .from('reservations')
            .insert({
              conversation_id: this.conversationId,
              name: args.name,
              email: args.email,
              date: args.date,
              time: args.time,
              guests: args.guests,
              status: 'confirmed'
            })
            .select()
            .single();

          if (!resvErr && resv) {
            console.log("Reservation created:", resv.id);
            
            // Send confirmation email
            const { data: config } = await supabase
              .from('agent_config')
              .select('restaurant_name')
              .limit(1)
              .maybeSingle();

            await supabase.functions.invoke('send-reservation-confirmation', {
              body: {
                name: args.name,
                email: args.email,
                date: args.date,
                time: args.time,
                guests: args.guests,
                restaurantName: config?.restaurant_name || 'Restaurant'
              }
            });
          }

          // Send function result back
          this.dc!.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: JSON.stringify({ success: true, message: 'Reservation created successfully' })
            }
          }));
          this.dc!.send(JSON.stringify({ type: 'response.create' }));
        }
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI Realtime API");
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

    } catch (error) {
      console.error("Error initializing chat:", error);
      throw error;
    }
  }

  async sendText(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  async disconnect() {
    // Update conversation status
    if (this.conversationId) {
      await supabase
        .from('conversations')
        .update({ 
          status: 'completed', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', this.conversationId);
    }

    this.dc?.close();
    this.pc?.close();
    this.audioEl.srcObject = null;
  }
}
