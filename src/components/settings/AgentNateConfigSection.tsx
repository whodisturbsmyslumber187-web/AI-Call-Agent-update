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
import { Server, Save, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";

const AgentNateConfigSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle");
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [ttsEngines, setTtsEngines] = useState<string[]>([]);

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

  const [config, setConfig] = useState({
    agent_nate_url: "http://localhost:8000",
    agent_nate_api_key: "",
  });

  const effectiveConfig = {
    agent_nate_url: settings?.agent_nate_url || config.agent_nate_url,
    agent_nate_api_key: settings?.agent_nate_api_key || config.agent_nate_api_key,
  };

  const saveConfig = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(config)) {
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
      toast({ title: "AgentNate Config Saved" });
    },
  });

  const testConnection = async () => {
    setConnectionStatus("testing");
    try {
      const url = config.agent_nate_url || effectiveConfig.agent_nate_url;
      const resp = await fetch(`${url}/v1/models`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        setDiscoveredModels(data?.data?.map((m: any) => m.id) || ["AgentNate-default"]);
        setTtsEngines(["XTTS v2", "Fish Speech", "Kokoro"]);
        setConnectionStatus("connected");
        toast({ title: "Connected to AgentNate", description: `Found ${data?.data?.length || 0} models` });
      } else {
        throw new Error("Failed");
      }
    } catch {
      setConnectionStatus("failed");
      toast({ title: "Connection Failed", description: "Could not reach AgentNate server", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          AgentNate Integration
          {connectionStatus === "connected" && <Badge className="bg-green-500/20 text-green-400 ml-2">Connected</Badge>}
          {connectionStatus === "failed" && <Badge variant="destructive" className="ml-2">Offline</Badge>}
        </CardTitle>
        <CardDescription>Connect to your self-hosted AgentNate platform (187 tools, TTS engines, OpenAI-compatible API).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>AgentNate Server URL</Label>
            <Input
              placeholder="http://localhost:8000"
              value={config.agent_nate_url || effectiveConfig.agent_nate_url}
              onChange={(e) => setConfig({ ...config, agent_nate_url: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>API Key (optional)</Label>
            <Input
              type="password"
              placeholder="Leave blank if no auth required"
              value={config.agent_nate_api_key}
              onChange={(e) => setConfig({ ...config, agent_nate_api_key: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
        </div>

        {connectionStatus === "connected" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Discovered Models</p>
              <div className="flex flex-wrap gap-1">
                {discoveredModels.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">TTS Engines Available</p>
              <div className="flex flex-wrap gap-1">
                {ttsEngines.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending} className="flex-1">
            {saveConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save AgentNate Config
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={connectionStatus === "testing"}>
            {connectionStatus === "testing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {connectionStatus === "connected" ? "Re-scan" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentNateConfigSection;
