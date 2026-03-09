import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
}

const CHANNELS = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

const TRIGGERS = [
  { value: "post_call", label: "After Call" },
  { value: "booking_confirm", label: "Booking Confirmation" },
  { value: "reminder", label: "Reminder" },
  { value: "follow_up", label: "Follow-up" },
];

const MessageTemplatesTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ channel: "sms", trigger_event: "post_call", template_text: "" });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["message-templates", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("message_templates").insert({
        business_id: businessId,
        ...newTemplate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates", businessId] });
      setShowAdd(false);
      setNewTemplate({ channel: "sms", trigger_event: "post_call", template_text: "" });
      toast({ title: "Template added" });
    },
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("message_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["message-templates", businessId] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["message-templates", businessId] }),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Message Templates
          </h3>
          <p className="text-sm text-muted-foreground">Automated SMS, WhatsApp & email follow-ups. Use {"{name}"}, {"{date}"}, {"{business}"} variables.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="mr-1 h-4 w-4" /> Add Template</Button>
      </div>

      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Channel</Label>
                <Select value={newTemplate.channel} onValueChange={(v) => setNewTemplate({ ...newTemplate, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Trigger</Label>
                <Select value={newTemplate.trigger_event} onValueChange={(v) => setNewTemplate({ ...newTemplate, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              placeholder="Thanks for calling {business}! Your booking for {date} is confirmed."
              value={newTemplate.template_text}
              onChange={(e) => setNewTemplate({ ...newTemplate, template_text: e.target.value })}
            />
            <Button size="sm" onClick={() => addTemplate.mutate()} disabled={addTemplate.isPending}>Save</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !templates?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">No message templates yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.channel}</Badge>
                    <Badge variant="secondary">{TRIGGERS.find(tr => tr.value === t.trigger_event)?.label || t.trigger_event}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.template_text}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.is_active} onCheckedChange={(v) => toggleTemplate.mutate({ id: t.id, is_active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTemplate.mutate(t.id)}>
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

export default MessageTemplatesTab;
