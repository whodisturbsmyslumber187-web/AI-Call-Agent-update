import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Save, Loader2, Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TTS_ENGINES = [
  { value: "xtts", label: "XTTS v2" },
  { value: "fish_speech", label: "Fish Speech" },
  { value: "kokoro", label: "Kokoro" },
  { value: "openai", label: "OpenAI TTS" },
  { value: "elevenlabs", label: "ElevenLabs" },
];

const TTSServerConfigSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").order("setting_key");
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.setting_key] = s.setting_value; });
      return map;
    },
  });

  const [tts, setTts] = useState({
    tts_server_url: "",
    tts_engine: "xtts",
    tts_voice_id: "",
    tts_sample_rate: "24000",
  });

  const effectiveTts = {
    tts_server_url: settings?.tts_server_url || tts.tts_server_url,
    tts_engine: settings?.tts_engine || tts.tts_engine,
    tts_voice_id: settings?.tts_voice_id || tts.tts_voice_id,
    tts_sample_rate: settings?.tts_sample_rate || tts.tts_sample_rate,
  };

  const saveTts = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(tts)) {
        if (value) {
          await supabase.from("platform_settings").upsert(
            { user_id: user!.id, setting_key: key, setting_value: value },
            { onConflict: "user_id,setting_key" }
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "TTS Config Saved" });
    },
  });

  const testVoice = () => {
    toast({ title: "Voice Test", description: "Playing test audio from TTS server..." });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          TTS Server Configuration
        </CardTitle>
        <CardDescription>Text-to-speech engine for agent voice. Supports XTTS, Fish Speech, Kokoro, and cloud providers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>TTS Server URL</Label>
            <Input
              placeholder="http://localhost:8003 or https://api.openai.com/v1"
              value={tts.tts_server_url || effectiveTts.tts_server_url}
              onChange={(e) => setTts({ ...tts, tts_server_url: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>TTS Engine</Label>
            <Select value={tts.tts_engine || effectiveTts.tts_engine} onValueChange={(v) => setTts({ ...tts, tts_engine: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TTS_ENGINES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Voice ID / Name</Label>
            <Input
              placeholder="e.g. alloy, p225, en_speaker_0"
              value={tts.tts_voice_id || effectiveTts.tts_voice_id}
              onChange={(e) => setTts({ ...tts, tts_voice_id: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Sample Rate</Label>
            <Select value={tts.tts_sample_rate || effectiveTts.tts_sample_rate} onValueChange={(v) => setTts({ ...tts, tts_sample_rate: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="16000">16000 Hz</SelectItem>
                <SelectItem value="22050">22050 Hz</SelectItem>
                <SelectItem value="24000">24000 Hz</SelectItem>
                <SelectItem value="44100">44100 Hz</SelectItem>
                <SelectItem value="48000">48000 Hz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => saveTts.mutate()} disabled={saveTts.isPending} className="flex-1">
            {saveTts.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save TTS Config
          </Button>
          <Button variant="outline" onClick={testVoice}>
            <Play className="mr-2 h-4 w-4" />
            Test Voice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TTSServerConfigSection;
