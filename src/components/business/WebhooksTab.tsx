import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Webhook, Plus, Trash2, Loader2, Send } from "lucide-react";

interface Props {
  businessId: string;
}

const EVENT_TYPES = [
  { value: "call_started", label: "Call Started" },
  { value: "call_ended", label: "Call Ended" },
  { value: "booking_created", label: "Booking Created" },
  { value: "lead_captured", label: "Lead Captured" },
];

const WebhooksTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ event_type: "call_ended", target_url: "", secret: "" });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addWebhook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("webhooks").insert({
        business_id: businessId,
        ...newWebhook,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", businessId] });
      setShowAdd(false);
      setNewWebhook({ event_type: "call_ended", target_url: "", secret: "" });
      toast({ title: "Webhook added" });
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhooks").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks", businessId] }),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks", businessId] }),
  });

  const testWebhook = async (webhook: any) => {
    try {
      const res = await fetch(webhook.target_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(webhook.secret ? { "X-Webhook-Secret": webhook.secret } : {}) },
        body: JSON.stringify({ event: webhook.event_type, test: true, timestamp: new Date().toISOString() }),
      });
      toast({ title: res.ok ? "Test successful" : `Test failed: ${res.status}` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" /> Webhooks & API
          </h3>
          <p className="text-sm text-muted-foreground">Send events to external services</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="mr-1 h-4 w-4" /> Add Webhook</Button>
      </div>

      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Event Type</Label>
                <Select value={newWebhook.event_type} onValueChange={(v) => setNewWebhook({ ...newWebhook, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target URL</Label>
                <Input placeholder="https://..." value={newWebhook.target_url} onChange={(e) => setNewWebhook({ ...newWebhook, target_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1 max-w-xs">
              <Label className="text-xs">Secret (optional)</Label>
              <Input placeholder="Signing secret" value={newWebhook.secret} onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })} />
            </div>
            <Button size="sm" onClick={() => addWebhook.mutate()} disabled={addWebhook.isPending}>Save</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !webhooks?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">No webhooks configured.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <Card key={wh.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{wh.event_type}</Badge>
                    <span className="text-sm text-foreground font-mono">{wh.target_url}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {wh.last_triggered_at && <span>Last: {new Date(wh.last_triggered_at).toLocaleString()}</span>}
                    {wh.last_status_code && <Badge variant={wh.last_status_code < 400 ? "secondary" : "destructive"}>{wh.last_status_code}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => testWebhook(wh)}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  <Switch checked={wh.is_active} onCheckedChange={(v) => toggleWebhook.mutate({ id: wh.id, is_active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteWebhook.mutate(wh.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebhooksTab;
