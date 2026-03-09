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
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Send, MessageCircle, Zap, Key, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TelegramConfigSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    bot_token_secret_name: "TELEGRAM_BOT_TOKEN",
    chat_id: "",
    is_active: false,
    linked_business_ids: [] as string[],
    notifications: {
      call_completed: true,
      daily_summary: true,
      sla_alert: true,
      booking_created: true,
      bulk_job_completed: true,
    },
  });
  const [newToken, setNewToken] = useState("");
  const [showTokenField, setShowTokenField] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("telegram_config").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: businesses } = useQuery({
    queryKey: ["businesses-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name, status, agent_mode").eq("user_id", user!.id).order("name");
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
      linked_business_ids: (config as any).linked_business_ids || [],
      notifications: config.notifications as any,
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        bot_token_secret_name: form.bot_token_secret_name,
        chat_id: form.chat_id,
        is_active: form.is_active,
        linked_business_ids: form.linked_business_ids,
        notifications: form.notifications,
      };
      if (config) {
        const { error } = await supabase.from("telegram_config").update(payload as any).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("telegram_config").insert({ ...payload, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-config"] });
      toast({ title: "Telegram config saved" });
    },
    onError: () => toast({ title: "Error saving config", variant: "destructive" }),
  });

  const updateToken = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke("telegram-bot", {
        body: { action: "update_token", user_id: user!.id, new_token: newToken },
      });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast({ title: "Bot token updated successfully" });
      setNewToken("");
      setShowTokenField(false);
    },
    onError: () => toast({ title: "Failed to update token", variant: "destructive" }),
  });

  const setWebhook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("telegram-bot", {
        body: { action: "set_webhook", user_id: user!.id },
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Webhook registered! Bot is now listening." }),
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

  const toggleBusiness = (bizId: string) => {
    setForm(prev => ({
      ...prev,
      linked_business_ids: prev.linked_business_ids.includes(bizId)
        ? prev.linked_business_ids.filter(id => id !== bizId)
        : [...prev.linked_business_ids, bizId],
    }));
  };

  const selectAllBusinesses = () => {
    if (!businesses) return;
    const allIds = businesses.map(b => b.id);
    const allSelected = allIds.every(id => form.linked_business_ids.includes(id));
    setForm(prev => ({
      ...prev,
      linked_business_ids: allSelected ? [] : allIds,
    }));
  };

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
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <Label>Enable Telegram Bot</Label>
          <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
        </div>

        {/* Bot Token Management */}
        <div className="space-y-2 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground" />Bot Token</Label>
            <Button variant="ghost" size="sm" onClick={() => setShowTokenField(!showTokenField)}>
              {showTokenField ? "Cancel" : "Change Token"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Secret name: <code className="bg-secondary px-1 rounded">{form.bot_token_secret_name}</code> — stored securely
          </p>
          {showTokenField && (
            <div className="flex gap-2 mt-2">
              <Input
                type="password"
                value={newToken}
                onChange={e => setNewToken(e.target.value)}
                placeholder="Paste new bot token from @BotFather"
                className="bg-secondary border-border font-mono text-xs flex-1"
              />
              <Button size="sm" onClick={() => updateToken.mutate()} disabled={!newToken || updateToken.isPending}>
                {updateToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          )}
          <div className="space-y-1 mt-2">
            <Label className="text-xs text-muted-foreground">Secret Name Override</Label>
            <Input value={form.bot_token_secret_name} onChange={e => setForm({ ...form, bot_token_secret_name: e.target.value })} className="bg-secondary border-border font-mono text-xs" placeholder="TELEGRAM_BOT_TOKEN" />
          </div>
        </div>

        {/* Chat ID */}
        <div className="space-y-2">
          <Label>Chat ID</Label>
          <Input value={form.chat_id} onChange={e => setForm({ ...form, chat_id: e.target.value })} className="bg-secondary border-border" placeholder="123456789" />
          <p className="text-xs text-muted-foreground">Send /start to your bot, then use @userinfobot to find your chat ID</p>
        </div>

        {/* Linked Agents/Businesses */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />Linked Agents
            </Label>
            {businesses && businesses.length > 0 && (
              <Button variant="ghost" size="sm" onClick={selectAllBusinesses}>
                {businesses.every(b => form.linked_business_ids.includes(b.id)) ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Choose which agents can be controlled and monitored via Telegram</p>
          {businesses && businesses.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {businesses.map(biz => (
                <div key={biz.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                  <Checkbox
                    checked={form.linked_business_ids.includes(biz.id)}
                    onCheckedChange={() => toggleBusiness(biz.id)}
                    id={`biz-${biz.id}`}
                  />
                  <label htmlFor={`biz-${biz.id}`} className="flex-1 cursor-pointer text-sm">
                    {biz.name}
                  </label>
                  <Badge variant={biz.status === "active" ? "default" : "secondary"} className="text-xs">
                    {biz.agent_mode}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No agents created yet. Create a business first.</p>
          )}
          {form.linked_business_ids.length > 0 && (
            <p className="text-xs text-muted-foreground">{form.linked_business_ids.length} agent(s) linked</p>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-3 border-t border-border pt-4">
          <Label className="text-foreground font-medium">Notifications</Label>
          {notifKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Switch checked={(form.notifications as any)[key]} onCheckedChange={v => setForm({ ...form, notifications: { ...form.notifications, [key]: v } })} />
            </div>
          ))}
        </div>

        {/* Commands Reference */}
        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-foreground font-medium">Available Commands</Label>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono text-muted-foreground">
            {["/status", "/calls", "/report [name]", "/pause [name]", "/resume [name]", "/bulk status", "/bookings", "/leads", "/sla", "/help"].map(c => (
              <span key={c} className="bg-secondary/50 rounded px-2 py-1">{c}</span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
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
