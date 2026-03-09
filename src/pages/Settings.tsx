import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Key, Plus, Trash2, Loader2, Check, X, Pencil, Radio, Volume2, Server, Wifi, WifiOff } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import LiveKitConfigSection from "@/components/settings/LiveKitConfigSection";
import TTSServerConfigSection from "@/components/settings/TTSServerConfigSection";
import AgentNateConfigSection from "@/components/settings/AgentNateConfigSection";
import ScheduledReportsSection from "@/components/settings/ScheduledReportsSection";
import ApiCredentialsSection from "@/components/settings/ApiCredentialsSection";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: platformSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("setting_key");
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.setting_key] = s.setting_value; });
      return map;
    },
  });

  const [defaults, setDefaults] = useState({
    llm_provider: "lovable_ai",
    llm_model: "google/gemini-3-flash-preview",
    tts_provider: "openai",
    default_voice: "alloy",
  });

  const effectiveDefaults = {
    llm_provider: platformSettings?.llm_provider || defaults.llm_provider,
    llm_model: platformSettings?.llm_model || defaults.llm_model,
    tts_provider: platformSettings?.tts_provider || defaults.tts_provider,
    default_voice: platformSettings?.default_voice || defaults.default_voice,
  };

  const saveDefaults = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(defaults);
      for (const [key, value] of entries) {
        const { error } = await supabase.from("platform_settings").upsert(
          { user_id: user!.id, setting_key: key, setting_value: value },
          { onConflict: "user_id,setting_key" }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "Defaults Saved", description: "New businesses will use these defaults." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">
          Global configuration — each business can override these in its own Providers tab
        </p>
      </div>

      {/* Default Provider Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Default Provider Preferences
          </CardTitle>
          <CardDescription>New businesses inherit these. Each can override in its Providers tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Default LLM Provider</Label>
              <Select value={defaults.llm_provider} onValueChange={(v) => setDefaults({ ...defaults, llm_provider: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable_ai">Lovable AI (built-in)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="agent_nate">AgentNate (self-hosted)</SelectItem>
                  <SelectItem value="custom">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default LLM Model</Label>
              <Input value={defaults.llm_model} onChange={(e) => setDefaults({ ...defaults, llm_model: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default TTS Provider</Label>
              <Select value={defaults.tts_provider} onValueChange={(v) => setDefaults({ ...defaults, tts_provider: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="xtts">XTTS (AgentNate)</SelectItem>
                  <SelectItem value="fish_speech">Fish Speech</SelectItem>
                  <SelectItem value="kokoro">Kokoro</SelectItem>
                  <SelectItem value="agent_nate_tts">AgentNate TTS</SelectItem>
                  <SelectItem value="custom_tts">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default Voice</Label>
              <Select value={defaults.default_voice} onValueChange={(v) => setDefaults({ ...defaults, default_voice: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((v) => (
                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => saveDefaults.mutate()} disabled={saveDefaults.isPending} className="w-full">
            {saveDefaults.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Defaults
          </Button>
        </CardContent>
      </Card>

      {/* LiveKit Configuration */}
      <LiveKitConfigSection />

      {/* TTS Server Configuration */}
      <TTSServerConfigSection />

      {/* AgentNate Connection */}
      <AgentNateConfigSection />

      {/* API Credentials CRUD */}
      <ApiCredentialsSection />

      {/* Scheduled Reports */}
      <ScheduledReportsSection />
    </div>
  );
};

export default Settings;
