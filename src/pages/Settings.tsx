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
import { Save, Shield, Key, Plus, Trash2, Loader2, Check, X, Pencil } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const PROVIDER_OPTIONS = [
  { value: "twilio", label: "Twilio" },
  { value: "livekit", label: "LiveKit" },
  { value: "vonage", label: "Vonage" },
  { value: "openai", label: "OpenAI" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "custom", label: "Custom" },
];

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load platform settings from DB
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

  // Sync from DB when loaded
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

  // API Credentials CRUD
  const { data: credentials = [], isLoading: credsLoading } = useQuery({
    queryKey: ["api-credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_credentials")
        .select("*")
        .order("provider", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [newCred, setNewCred] = useState({ name: "", provider: "custom", credential_key: "", credential_value_encrypted: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", credential_key: "", credential_value_encrypted: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);

  const addCredential = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("api_credentials").insert({
        user_id: user!.id,
        ...newCred,
        is_configured: !!newCred.credential_value_encrypted,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-credentials"] });
      setNewCred({ name: "", provider: "custom", credential_key: "", credential_value_encrypted: "" });
      setShowAddDialog(false);
      toast({ title: "Credential Added" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateCredential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_credentials").update({
        name: editForm.name,
        credential_key: editForm.credential_key,
        credential_value_encrypted: editForm.credential_value_encrypted,
        is_configured: !!editForm.credential_value_encrypted,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-credentials"] });
      setEditingId(null);
      toast({ title: "Credential Updated" });
    },
  });

  const deleteCredential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-credentials"] });
      toast({ title: "Credential Deleted" });
    },
  });

  // Group credentials by provider
  const groupedCreds = credentials.reduce((acc: Record<string, any[]>, cred: any) => {
    if (!acc[cred.provider]) acc[cred.provider] = [];
    acc[cred.provider].push(cred);
    return acc;
  }, {});

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

      {/* Editable API Credentials */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">API Keys & Credentials</h2>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Credential</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add API Credential</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={newCred.provider} onValueChange={(v) => setNewCred({ ...newCred, provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input placeholder="e.g. Production Twilio" value={newCred.name} onChange={(e) => setNewCred({ ...newCred, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input placeholder="e.g. TWILIO_ACCOUNT_SID" value={newCred.credential_key} onChange={(e) => setNewCred({ ...newCred, credential_key: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Value / Secret Reference</Label>
                  <Input type="password" placeholder="sk-..." value={newCred.credential_value_encrypted} onChange={(e) => setNewCred({ ...newCred, credential_value_encrypted: e.target.value })} />
                </div>
                <Button onClick={() => addCredential.mutate()} disabled={addCredential.isPending || !newCred.name || !newCred.credential_key} className="w-full">
                  {addCredential.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Credential
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Add, edit, or remove API credentials. Each business can select which credential set to use.
        </p>

        {credsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : Object.keys(groupedCreds).length === 0 && credentials.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No API credentials configured. Click "Add Credential" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Object.entries(groupedCreds).map(([provider, creds]) => (
              <Card key={provider} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground capitalize">{provider}</CardTitle>
                    {(creds as any[]).every((c: any) => c.is_configured) ? (
                      <Badge className="bg-primary text-primary-foreground">Configured</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Partial</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(creds as any[]).map((cred: any) => (
                      <div key={cred.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50">
                        {editingId === cred.id ? (
                          <div className="flex-1 grid grid-cols-3 gap-2 mr-2">
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="h-8 text-sm" />
                            <Input value={editForm.credential_key} onChange={(e) => setEditForm({ ...editForm, credential_key: e.target.value })} placeholder="Key" className="h-8 text-sm" />
                            <Input type="password" value={editForm.credential_value_encrypted} onChange={(e) => setEditForm({ ...editForm, credential_value_encrypted: e.target.value })} placeholder="Value" className="h-8 text-sm" />
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm font-medium text-foreground">{cred.name}</span>
                            <span className="text-xs text-muted-foreground ml-2 font-mono">({cred.credential_key})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {editingId === cred.id ? (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCredential.mutate(cred.id)}>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {cred.is_configured ? (
                                <Badge variant="secondary" className="text-xs mr-2">✓ Set</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground mr-2">Missing</Badge>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                setEditingId(cred.id);
                                setEditForm({ name: cred.name, credential_key: cred.credential_key, credential_value_encrypted: "" });
                              }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteCredential.mutate(cred.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
