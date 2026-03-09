import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Phone, Radio, Key } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const { toast } = useToast();
  const [defaults, setDefaults] = useState({
    llm_provider: "lovable_ai",
    llm_model: "google/gemini-3-flash-preview",
    tts_provider: "openai",
    default_voice: "alloy",
  });

  const handleSaveDefaults = () => {
    toast({
      title: "Defaults Saved",
      description: "New businesses will use these default provider settings.",
    });
  };

  const secretGroups = [
    {
      title: "Twilio",
      icon: Phone,
      description: "Required for inbound/outbound phone calls and number provisioning",
      secrets: [
        { name: "TWILIO_ACCOUNT_SID", label: "Account SID", set: false },
        { name: "TWILIO_AUTH_TOKEN", label: "Auth Token", set: false },
      ],
    },
    {
      title: "LiveKit",
      icon: Radio,
      description: "Required for browser-based WebRTC voice calls",
      secrets: [
        { name: "LIVEKIT_API_KEY", label: "API Key", set: true },
        { name: "LIVEKIT_API_SECRET", label: "API Secret", set: true },
        { name: "LIVEKIT_URL", label: "WebSocket URL", set: true },
      ],
    },
    {
      title: "Vonage",
      icon: Phone,
      description: "Alternative telephony provider for number provisioning",
      secrets: [
        { name: "VONAGE_API_KEY", label: "API Key", set: false },
        { name: "VONAGE_API_SECRET", label: "API Secret", set: false },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">
          Global configuration for your multi-tenant AI call center
        </p>
      </div>

      {/* Default Provider Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Default Provider Preferences
          </CardTitle>
          <CardDescription>
            New businesses will inherit these defaults. Each business can override them in its Providers tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Default LLM Provider</Label>
              <Select
                value={defaults.llm_provider}
                onValueChange={(v) => setDefaults({ ...defaults, llm_provider: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
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
              <Input
                value={defaults.llm_model}
                onChange={(e) => setDefaults({ ...defaults, llm_model: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default TTS Provider</Label>
              <Select
                value={defaults.tts_provider}
                onValueChange={(v) => setDefaults({ ...defaults, tts_provider: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="agent_nate_tts">AgentNate TTS</SelectItem>
                  <SelectItem value="custom_tts">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default Voice</Label>
              <Select
                value={defaults.default_voice}
                onValueChange={(v) => setDefaults({ ...defaults, default_voice: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveDefaults} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Defaults
          </Button>
        </CardContent>
      </Card>

      {/* API Keys & Credentials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">API Keys & Credentials</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Platform-level secrets used by backend functions. These are stored securely and never exposed to the browser.
        </p>

        <div className="grid gap-4">
          {secretGroups.map((group) => (
            <Card key={group.title} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base text-foreground">{group.title}</CardTitle>
                  </div>
                  {group.secrets.every((s) => s.set) ? (
                    <Badge className="bg-primary text-primary-foreground">Configured</Badge>
                  ) : group.secrets.some((s) => s.set) ? (
                    <Badge variant="secondary">Partial</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Not Set</Badge>
                  )}
                </div>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.secrets.map((secret) => (
                    <div key={secret.name} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/50">
                      <div>
                        <span className="text-sm font-mono text-foreground">{secret.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({secret.label})</span>
                      </div>
                      {secret.set ? (
                        <Badge variant="secondary" className="text-xs">✓ Set</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Missing</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
