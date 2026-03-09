import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Bot, Volume2, Video, Ear, Settings2 } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "lovable_ai", label: "Lovable AI (Cloud)", description: "Gemini & GPT-5 — no API key needed" },
  { value: "openai", label: "OpenAI", description: "GPT-4o, GPT-5 via OpenAI API" },
  { value: "anthropic", label: "Anthropic", description: "Claude 4, Claude 4 Sonnet, Claude 3.5" },
  { value: "ollama", label: "Ollama (Local)", description: "Self-hosted — llama3, mistral, phi-3, qwen2" },
  { value: "groq", label: "Groq", description: "Ultra-fast — llama3-70b, mixtral, gemma2" },
  { value: "together", label: "Together AI", description: "Open-source model hosting" },
  { value: "mistral", label: "Mistral AI", description: "Mistral Large, Medium, Small" },
  { value: "deepseek", label: "DeepSeek", description: "DeepSeek V3, Coder" },
  { value: "perplexity", label: "Perplexity", description: "pplx-70b-online with search" },
  { value: "cohere", label: "Cohere", description: "Command R+, Command R" },
  { value: "azure_openai", label: "Azure OpenAI", description: "Enterprise GPT deployments" },
  { value: "aws_bedrock", label: "AWS Bedrock", description: "Claude/Titan via AWS" },
  { value: "agent_nate", label: "AgentNate (Self-hosted)", description: "Connect to your AgentNate server" },
  { value: "custom", label: "Custom Endpoint", description: "Any OpenAI-compatible API" },
];

const LOVABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-3.1-pro-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5.2",
  "openai/gpt-5-nano",
];

const OLLAMA_MODELS = ["llama3", "llama3:70b", "mistral", "codestral", "phi-3", "qwen2", "gemma2", "deepseek-coder-v2", "command-r"];
const ANTHROPIC_MODELS = ["claude-4-opus", "claude-4-sonnet", "claude-3.5-sonnet", "claude-3.5-haiku"];
const GROQ_MODELS = ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"];
const MISTRAL_MODELS = ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "codestral-latest"];
const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-coder"];

const TTS_PROVIDERS = [
  { value: "openai", label: "OpenAI TTS", description: "Built-in with OpenAI Realtime" },
  { value: "elevenlabs", label: "ElevenLabs", description: "High-quality voices with cloning" },
  { value: "agent_nate_tts", label: "AgentNate TTS (Self-hosted)", description: "XTTS, Fish Speech, Kokoro" },
  { value: "custom_tts", label: "Custom TTS Endpoint", description: "Any TTS API" },
];

const STT_PROVIDERS = [
  { value: "deepgram", label: "Deepgram", description: "Nova-2 — fastest & most accurate" },
  { value: "openai_whisper", label: "OpenAI Whisper", description: "whisper-large-v3" },
  { value: "google_stt", label: "Google STT", description: "Chirp, latest_long" },
  { value: "assemblyai", label: "AssemblyAI", description: "Best, Nano models" },
  { value: "gladia", label: "Gladia", description: "Multi-language transcription" },
  { value: "agent_nate_stt", label: "AgentNate STT", description: "Self-hosted Whisper" },
];

interface Props {
  business: any;
}

const ProvidersTab = ({ business }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    llm_provider: business.llm_provider || "lovable_ai",
    llm_model: business.llm_model || "google/gemini-3-flash-preview",
    llm_api_endpoint: business.llm_api_endpoint || "",
    llm_api_key_name: business.llm_api_key_name || "",
    tts_provider: business.tts_provider || "openai",
    tts_voice_id: business.tts_voice_id || "",
    tts_api_endpoint: business.tts_api_endpoint || "",
    tts_api_key_name: business.tts_api_key_name || "",
    stt_provider: business.stt_provider || "deepgram",
    stt_model: business.stt_model || "nova-2",
    endpointing_threshold_ms: business.endpointing_threshold_ms || 500,
    barge_in_enabled: business.barge_in_enabled !== false,
    voicemail_detection_enabled: business.voicemail_detection_enabled || false,
    livekit_enabled: business.livekit_enabled || false,
    livekit_room_prefix: business.livekit_room_prefix || "",
  });

  const needsEndpoint = ["agent_nate", "custom", "ollama", "together", "azure_openai", "aws_bedrock"].includes(form.llm_provider);
  const needsApiKey = !["lovable_ai", "ollama"].includes(form.llm_provider);
  const showTtsEndpoint = form.tts_provider === "agent_nate_tts" || form.tts_provider === "custom_tts";

  const getModelList = () => {
    switch (form.llm_provider) {
      case "lovable_ai": return LOVABLE_MODELS;
      case "ollama": return OLLAMA_MODELS;
      case "anthropic": return ANTHROPIC_MODELS;
      case "groq": return GROQ_MODELS;
      case "mistral": return MISTRAL_MODELS;
      case "deepseek": return DEEPSEEK_MODELS;
      default: return null;
    }
  };

  const modelList = getModelList();

  const updateProviders = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("businesses")
        .update({
          llm_provider: form.llm_provider,
          llm_model: form.llm_model,
          llm_api_endpoint: form.llm_api_endpoint || null,
          llm_api_key_name: form.llm_api_key_name || null,
          tts_provider: form.tts_provider,
          tts_voice_id: form.tts_voice_id || null,
          tts_api_endpoint: form.tts_api_endpoint || null,
          tts_api_key_name: form.tts_api_key_name || null,
          stt_provider: form.stt_provider,
          stt_model: form.stt_model,
          endpointing_threshold_ms: form.endpointing_threshold_ms,
          barge_in_enabled: form.barge_in_enabled,
          voicemail_detection_enabled: form.voicemail_detection_enabled,
          livekit_enabled: form.livekit_enabled,
          livekit_room_prefix: form.livekit_room_prefix || null,
        })
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", business.id] });
      toast({ title: "Providers saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* LLM Provider */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><CardTitle className="text-base">LLM Provider</CardTitle></div>
          <CardDescription>Choose how this agent's brain works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LLM_PROVIDERS.map((p) => (
              <button key={p.value} onClick={() => setForm({ ...form, llm_provider: p.value })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${form.llm_provider === p.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                <p className="text-xs font-medium text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p.description}</p>
              </button>
            ))}
          </div>

          {modelList && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={form.llm_model} onValueChange={(v) => setForm({ ...form, llm_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{modelList.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {!modelList && form.llm_provider !== "lovable_ai" && (
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input value={form.llm_model} onChange={(e) => setForm({ ...form, llm_model: e.target.value })} placeholder="gpt-4o" />
            </div>
          )}

          {needsEndpoint && (
            <div className="space-y-2">
              <Label>API Endpoint</Label>
              <Input value={form.llm_api_endpoint} onChange={(e) => setForm({ ...form, llm_api_endpoint: e.target.value })}
                placeholder={form.llm_provider === "ollama" ? "http://localhost:11434/v1/chat/completions" : "https://api.example.com/v1/chat/completions"} />
              {form.llm_provider === "ollama" && <p className="text-xs text-muted-foreground">Ollama runs locally. Make sure the server is accessible.</p>}
            </div>
          )}

          {needsApiKey && (
            <div className="space-y-2">
              <Label>API Key Secret Name</Label>
              <Input value={form.llm_api_key_name} onChange={(e) => setForm({ ...form, llm_api_key_name: e.target.value })} placeholder="OPENAI_API_KEY" />
              <p className="text-xs text-muted-foreground">Name of the secret stored in your backend.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STT Provider */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2"><Ear className="h-5 w-5 text-primary" /><CardTitle className="text-base">Speech-to-Text Provider</CardTitle></div>
          <CardDescription>How the agent understands what callers say</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STT_PROVIDERS.map((p) => (
              <button key={p.value} onClick={() => setForm({ ...form, stt_provider: p.value })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${form.stt_provider === p.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                <p className="text-xs font-medium text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Controls */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /><CardTitle className="text-base">Voice Controls</CardTitle></div>
          <CardDescription>Fine-tune how the agent listens and responds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Endpointing Threshold</Label>
              <span className="text-xs text-muted-foreground font-mono">{form.endpointing_threshold_ms}ms</span>
            </div>
            <Slider value={[form.endpointing_threshold_ms]} onValueChange={([v]) => setForm({ ...form, endpointing_threshold_ms: v })} min={200} max={2000} step={50} />
            <p className="text-xs text-muted-foreground">How long to wait after the caller stops speaking before the agent responds. Lower = faster but may cut off speech.</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Barge-In</p>
              <p className="text-xs text-muted-foreground">Allow callers to interrupt the agent while it's speaking</p>
            </div>
            <Switch checked={form.barge_in_enabled} onCheckedChange={(v) => setForm({ ...form, barge_in_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Voicemail Detection</p>
              <p className="text-xs text-muted-foreground">Auto-detect answering machines on outbound calls</p>
            </div>
            <Switch checked={form.voicemail_detection_enabled} onCheckedChange={(v) => setForm({ ...form, voicemail_detection_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      {/* TTS Provider */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-primary" /><CardTitle className="text-base">Text-to-Speech Provider</CardTitle></div>
          <CardDescription>Choose the voice engine for this agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TTS_PROVIDERS.map((p) => (
              <button key={p.value} onClick={() => setForm({ ...form, tts_provider: p.value })}
                className={`p-3 rounded-lg border text-left transition-colors ${form.tts_provider === p.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>
          {form.tts_provider === "elevenlabs" && (
            <div className="space-y-2">
              <Label>ElevenLabs Voice ID</Label>
              <Input value={form.tts_voice_id} onChange={(e) => setForm({ ...form, tts_voice_id: e.target.value })} placeholder="JBFqnCBsd6RMkjVDRZzb" />
            </div>
          )}
          {showTtsEndpoint && (
            <>
              <div className="space-y-2">
                <Label>TTS API Endpoint</Label>
                <Input value={form.tts_api_endpoint} onChange={(e) => setForm({ ...form, tts_api_endpoint: e.target.value })} placeholder="http://your-server:8000/api/tts" />
              </div>
              <div className="space-y-2">
                <Label>TTS API Key Secret Name</Label>
                <Input value={form.tts_api_key_name} onChange={(e) => setForm({ ...form, tts_api_key_name: e.target.value })} placeholder="TTS_API_KEY" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* LiveKit */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" /><CardTitle className="text-base">LiveKit (Browser Voice)</CardTitle></div>
          <CardDescription>Enable browser-based voice calls via LiveKit WebRTC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable LiveKit</p>
              <p className="text-xs text-muted-foreground">Allow callers to connect via browser</p>
            </div>
            <Switch checked={form.livekit_enabled} onCheckedChange={(v) => setForm({ ...form, livekit_enabled: v })} />
          </div>
          {form.livekit_enabled && (
            <div className="space-y-2">
              <Label>Room Prefix</Label>
              <Input value={form.livekit_room_prefix} onChange={(e) => setForm({ ...form, livekit_room_prefix: e.target.value })}
                placeholder={business.name.toLowerCase().replace(/\s+/g, "-")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => updateProviders.mutate()} disabled={updateProviders.isPending} className="w-full">
        {updateProviders.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Provider Settings
      </Button>
    </div>
  );
};

export default ProvidersTab;
