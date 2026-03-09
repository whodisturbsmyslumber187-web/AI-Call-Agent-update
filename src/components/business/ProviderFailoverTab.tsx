import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Shield, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface Props { businessId: string; }

const ProviderFailoverTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    primary_provider: "lovable_ai",
    backup_provider: "openai",
    max_failures_before_switch: 3,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["provider-failover", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_failover_config").select("*").eq("business_id", businessId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) setForm({
      primary_provider: config.primary_provider,
      backup_provider: config.backup_provider,
      max_failures_before_switch: config.max_failures_before_switch,
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("provider_failover_config").upsert({ business_id: businessId, ...form }, { onConflict: "business_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-failover", businessId] });
      toast({ title: "Failover config saved" });
    },
  });

  const providers = [
    { value: "lovable_ai", label: "Lovable AI" },
    { value: "openai", label: "OpenAI" },
    { value: "agent_nate", label: "AgentNate" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Card className="bg-card border-border max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground"><Shield className="h-5 w-5 text-primary" />Provider Failover</CardTitle>
        <CardDescription>Auto-switch to backup provider if primary fails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {config?.is_failed_over && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Currently failed over to backup ({config.backup_provider})</span>
          </div>
        )}
        <div className="space-y-2">
          <Label>Primary Provider</Label>
          <Select value={form.primary_provider} onValueChange={v => setForm({ ...form, primary_provider: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{providers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Backup Provider</Label>
          <Select value={form.backup_provider} onValueChange={v => setForm({ ...form, backup_provider: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{providers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Max Failures Before Switch</Label>
          <Input type="number" value={form.max_failures_before_switch} onChange={e => setForm({ ...form, max_failures_before_switch: Number(e.target.value) })} className="bg-secondary border-border" />
        </div>
        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProviderFailoverTab;
