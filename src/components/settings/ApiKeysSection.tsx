import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Key, Copy } from "lucide-react";

const ApiKeysSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const rawKey = "ak_" + crypto.randomUUID().replace(/-/g, "");
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase.from("api_keys").insert({
        user_id: user!.id,
        key_hash: keyHash,
        key_prefix: rawKey.substring(0, 8),
        name,
      });
      if (error) throw error;
      setNewKey(rawKey);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "API key created — copy it now!" });
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const toggleKey = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"><Key className="h-5 w-5 text-primary" />API Keys</CardTitle>
        <CardDescription>Manage API keys for external integrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setNewKey(""); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Create API Key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{newKey ? "API Key Created" : "Create API Key"}</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Copy this key now — you won't see it again!</p>
                <div className="flex gap-2">
                  <Input value={newKey} readOnly className="font-mono text-xs bg-secondary" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(newKey); toast({ title: "Copied!" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => { setDialogOpen(false); setNewKey(""); }}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Key Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My integration" /></div>
                <Button className="w-full" onClick={() => createKey.mutate()} disabled={!name || createKey.isPending}>
                  {createKey.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}Generate Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div className="space-y-2">
            {keys?.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{k.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{k.key_prefix}... • Rate: {k.rate_limit}/min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={k.is_active ? "default" : "secondary"}>{k.is_active ? "Active" : "Disabled"}</Badge>
                  <Switch checked={k.is_active} onCheckedChange={v => toggleKey.mutate({ id: k.id, is_active: v })} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteKey.mutate(k.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiKeysSection;
