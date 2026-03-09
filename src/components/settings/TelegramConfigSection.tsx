import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Send, MessageCircle, Zap } from "lucide-react";

const TelegramConfigSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    bot_token_secret_name: "TELEGRAM_BOT_TOKEN",
    chat_id: "",
    is_active: false,
    notifications: {
      call_completed: true,
      daily_summary: true,
      sla_alert: true,
      booking_created: true,
      bulk_job_completed: true,
    },
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("telegram_config").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (config) setForm({
      bot_token_secret_name: config.bot_token_secret_name,
      chat_id: config.chat_id,
      is_active: config.is_active,
      notifications: config.notifications as any,
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      if (config) {
        const { error } = await supabase.from("telegram_config").update(form).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("telegram_config").insert({ ...form, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-config"] });
      toast({ title: "Telegram config saved" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const setWebhook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("telegram-bot", {
        body: { action: "set_webhook", user_id: user!.id },
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Webhook registered! Bot is now listening for commands." }),
    onError: () => toast({ title: "Failed to set webhook", variant: "destructive" }),
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("telegram-bot", {
        body: { action: "notify", user_id: user!.id, message: "✅ AgentHub test notification — connection successful!" },
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Test sent! Check Telegram." }),
    onError: () => toast({ title: "Failed to send test", variant: "destructive" }),
  });

  const notifKeys = [
    { key: "call_completed", label: "Call Completed" },
    { key: "daily_summary", label: "Daily Summary" },
    { key: "sla_alert", label: "SLA Alert" },
    { key: "booking_created", label: "Booking Created" },
    { key: "bulk_job_completed", label: "Bulk Job Completed" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Telegram Bot Control</CardTitle>
        <CardDescription>Control your entire platform from Telegram. Send commands, receive alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Telegram Bot</Label>
          <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
        </div>
        <div className="space-y-2">
          <Label>Bot Token Secret Name</Label>
          <Input value={form.bot_token_secret_name} onChange={e => setForm({ ...form, bot_token_secret_name: e.target.value })} className="bg-secondary border-border font-mono text-xs" placeholder="TELEGRAM_BOT_TOKEN" />
          <p className="text-xs text-muted-foreground">Store your bot token as a secret with this name</p>
        </div>
        <div className="space-y-2">
          <Label>Chat ID</Label>
          <Input value={form.chat_id} onChange={e => setForm({ ...form, chat_id: e.target.value })} className="bg-secondary border-border" placeholder="123456789" />
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <Label className="text-foreground font-medium">Notifications</Label>
          {notifKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Switch checked={(form.notifications as any)[key]} onCheckedChange={v => setForm({ ...form, notifications: { ...form.notifications, [key]: v } })} />
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-foreground font-medium">Available Commands</Label>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono text-muted-foreground">
            {["/status", "/calls", "/report [name]", "/pause [name]", "/resume [name]", "/bulk status", "/bookings", "/leads", "/sla", "/help"].map(c => (
              <span key={c} className="bg-secondary/50 rounded px-2 py-1">{c}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Config
          </Button>
          <Button variant="outline" onClick={() => setWebhook.mutate()} disabled={setWebhook.isPending || !form.chat_id}>
            {setWebhook.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}Set Webhook
          </Button>
          <Button variant="outline" onClick={() => testConnection.mutate()} disabled={testConnection.isPending || !form.chat_id}>
            {testConnection.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramConfigSection;
