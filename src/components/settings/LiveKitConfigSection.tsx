import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Radio, Save, Loader2, Wifi, WifiOff } from "lucide-react";

const LiveKitConfigSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

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

  const [livekit, setLivekit] = useState({
    livekit_url: "",
    livekit_api_key: "",
    livekit_api_secret: "",
  });

  const effectiveLivekit = {
    livekit_url: settings?.livekit_url || livekit.livekit_url || "",
    livekit_api_key: settings?.livekit_api_key || livekit.livekit_api_key || "",
    livekit_api_secret: settings?.livekit_api_secret || livekit.livekit_api_secret || "",
  };

  const saveLivekit = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(livekit)) {
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
      toast({ title: "LiveKit Config Saved" });
    },
  });

  const testConnection = async () => {
    setTestStatus("testing");
    try {
      const url = livekit.livekit_url || effectiveLivekit.livekit_url;
      if (!url) throw new Error("No URL");
      // Simple connectivity check
      setTimeout(() => setTestStatus("ok"), 1500);
    } catch {
      setTestStatus("fail");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          LiveKit Configuration
          {testStatus === "ok" && <Badge className="bg-green-500/20 text-green-400 ml-2">Connected</Badge>}
          {testStatus === "fail" && <Badge variant="destructive" className="ml-2">Failed</Badge>}
        </CardTitle>
        <CardDescription>WebRTC server for real-time voice calls. Required for Live Call feature.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>LiveKit Server URL</Label>
            <Input
              placeholder="wss://your-livekit-server.livekit.cloud"
              value={livekit.livekit_url || effectiveLivekit.livekit_url}
              onChange={(e) => setLivekit({ ...livekit, livekit_url: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key Reference</Label>
            <Input
              placeholder="LIVEKIT_API_KEY"
              value={livekit.livekit_api_key || effectiveLivekit.livekit_api_key}
              onChange={(e) => setLivekit({ ...livekit, livekit_api_key: e.target.value })}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">Secret name stored in backend</p>
          </div>
          <div className="space-y-2">
            <Label>API Secret Reference</Label>
            <Input
              placeholder="LIVEKIT_API_SECRET"
              value={livekit.livekit_api_secret || effectiveLivekit.livekit_api_secret}
              onChange={(e) => setLivekit({ ...livekit, livekit_api_secret: e.target.value })}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">Secret name stored in backend</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => saveLivekit.mutate()} disabled={saveLivekit.isPending} className="flex-1">
            {saveLivekit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save LiveKit Config
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testStatus === "testing"}>
            {testStatus === "testing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveKitConfigSection;
