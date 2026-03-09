import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Bot, Volume2, Video } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "lovable_ai", label: "Lovable AI (Cloud)", description: "Gemini & GPT-5 — no API key needed" },
  { value: "openai", label: "OpenAI", description: "GPT-4o, GPT-5 via OpenAI API" },
  { value: "agent_nate", label: "AgentNate (Self-hosted)", description: "Connect to your AgentNate server" },
  { value: "custom", label: "Custom Endpoint", description: "Any OpenAI-compatible API" },
];

const LOVABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5.2",
];

const TTS_PROVIDERS = [
  { value: "openai", label: "OpenAI TTS", description: "Built-in with OpenAI Realtime" },
  { value: "elevenlabs", label: "ElevenLabs", description: "High-quality voices with cloning" },
  { value: "agent_nate_tts", label: "AgentNate TTS (Self-hosted)", description: "XTTS, Fish Speech, Kokoro" },
  { value: "custom_tts", label: "Custom TTS Endpoint", description: "Any TTS API" },
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
    livekit_enabled: business.livekit_enabled || false,
    livekit_room_prefix: business.livekit_room_prefix || "",
  });

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
          livekit_enabled: form.livekit_enabled,
          livekit_room_prefix: form.livekit_room_prefix || null,
        })
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", business.id] });
      toast({ title: "Providers saved", description: "AI provider configuration updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save providers", variant: "destructive" });
    },
  });

  const showEndpoint = form.llm_provider === "agent_nate" || form.llm_provider === "custom";
  const showTtsEndpoint = form.tts_provider === "agent_nate_tts" || form.tts_provider === "custom_tts";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* LLM Provider */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">LLM Provider</CardTitle>
          </div>
          <CardDescription>Choose how this agent's brain works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {LLM_PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => setForm({ ...form, llm_provider: p.value })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  form.llm_provider === p.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>

          {form.llm_provider === "lovable_ai" && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={form.llm_model} onValueChange={(v) => setForm({ ...form, llm_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOVABLE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showEndpoint && (
            <>
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input
                  value={form.llm_api_endpoint}
                  onChange={(e) => setForm({ ...form, llm_api_endpoint: e.target.value })}
                  placeholder={form.llm_provider === "agent_nate" ? "http://your-server:8000/v1/chat/completions" : "https://api.example.com/v1/chat/completions"}
                />
                {form.llm_provider === "agent_nate" && (
                  <p className="text-xs text-muted-foreground">
                    AgentNate exposes an OpenAI-compatible API at port 8000. Make sure your server is accessible from the internet.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>API Key Secret Name (optional)</Label>
                <Input
                  value={form.llm_api_key_name}
                  onChange={(e) => setForm({ ...form, llm_api_key_name: e.target.value })}
                  placeholder="AGENTNATE_API_KEY"
                />
                <p className="text-xs text-muted-foreground">
                  Name of the secret stored in your backend. Leave empty if no auth required.
                </p>
              </div>
            </>
          )}

          {form.llm_provider === "openai" && (
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input
                value={form.llm_model}
                onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
                placeholder="gpt-4o"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTS Provider */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Text-to-Speech Provider</CardTitle>
          </div>
          <CardDescription>Choose the voice engine for this agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TTS_PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => setForm({ ...form, tts_provider: p.value })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  form.tts_provider === p.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>

          {form.tts_provider === "elevenlabs" && (
            <div className="space-y-2">
              <Label>ElevenLabs Voice ID</Label>
              <Input
                value={form.tts_voice_id}
                onChange={(e) => setForm({ ...form, tts_voice_id: e.target.value })}
                placeholder="JBFqnCBsd6RMkjVDRZzb"
              />
              <p className="text-xs text-muted-foreground">
                Find voices at the <a href="https://elevenlabs.io/voice-library" target="_blank" className="text-primary underline">ElevenLabs Voice Library</a>
              </p>
            </div>
          )}

          {showTtsEndpoint && (
            <>
              <div className="space-y-2">
                <Label>TTS API Endpoint</Label>
                <Input
                  value={form.tts_api_endpoint}
                  onChange={(e) => setForm({ ...form, tts_api_endpoint: e.target.value })}
                  placeholder={form.tts_provider === "agent_nate_tts" ? "http://your-server:8000/api/tts" : "https://api.example.com/tts"}
                />
              </div>
              <div className="space-y-2">
                <Label>TTS API Key Secret Name (optional)</Label>
                <Input
                  value={form.tts_api_key_name}
                  onChange={(e) => setForm({ ...form, tts_api_key_name: e.target.value })}
                  placeholder="TTS_API_KEY"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* LiveKit */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">LiveKit (Browser Voice)</CardTitle>
          </div>
          <CardDescription>Enable browser-based voice calls via LiveKit WebRTC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable LiveKit</p>
              <p className="text-xs text-muted-foreground">Allow callers to connect via browser alongside phone</p>
            </div>
            <Switch
              checked={form.livekit_enabled}
              onCheckedChange={(v) => setForm({ ...form, livekit_enabled: v })}
            />
          </div>
          {form.livekit_enabled && (
            <div className="space-y-2">
              <Label>Room Prefix</Label>
              <Input
                value={form.livekit_room_prefix}
                onChange={(e) => setForm({ ...form, livekit_room_prefix: e.target.value })}
                placeholder={business.name.toLowerCase().replace(/\s+/g, "-")}
              />
              <p className="text-xs text-muted-foreground">
                Rooms will be created as: {form.livekit_room_prefix || business.name.toLowerCase().replace(/\s+/g, "-")}-[session-id]
              </p>
            </div>
          )}
          {form.livekit_enabled && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Setup:</strong> You'll need a <a href="https://cloud.livekit.io" target="_blank" className="text-primary underline">LiveKit Cloud</a> account. 
                Add your <code className="bg-background px-1 rounded">LIVEKIT_API_KEY</code> and <code className="bg-background px-1 rounded">LIVEKIT_API_SECRET</code> as backend secrets.
              </p>
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
