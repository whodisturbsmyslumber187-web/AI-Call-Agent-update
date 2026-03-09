import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Trash2, Loader2, Check, X, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PROVIDER_OPTIONS = [
  { value: "twilio", label: "Twilio" },
  { value: "livekit", label: "LiveKit" },
  { value: "vonage", label: "Vonage" },
  { value: "openai", label: "OpenAI" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "agent_nate", label: "AgentNate" },
  { value: "custom", label: "Custom" },
];

const ApiCredentialsSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["api-credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_credentials").select("*").order("provider", { ascending: true });
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
        user_id: user!.id, ...newCred, is_configured: !!newCred.credential_value_encrypted,
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
        name: editForm.name, credential_key: editForm.credential_key,
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

  const groupedCreds = credentials.reduce((acc: Record<string, any[]>, cred: any) => {
    if (!acc[cred.provider]) acc[cred.provider] = [];
    acc[cred.provider].push(cred);
    return acc;
  }, {});

  return (
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
      <p className="text-sm text-muted-foreground">Add, edit, or remove API credentials. Each business can select which credential set to use.</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : Object.keys(groupedCreds).length === 0 ? (
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
                  <CardTitle className="text-base text-foreground capitalize">{provider.replace("_", " ")}</CardTitle>
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
  );
};

export default ApiCredentialsSection;
