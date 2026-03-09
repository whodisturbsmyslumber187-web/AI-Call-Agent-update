import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldAlert, Plus, Trash2, Bell } from "lucide-react";
import { format } from "date-fns";

const RULE_TYPES = [
  { value: "max_wait_time", label: "Max Wait Time (seconds)", unit: "s" },
  { value: "max_missed_calls", label: "Max Missed Calls / Day", unit: "" },
  { value: "min_satisfaction", label: "Min Satisfaction Score (1-5)", unit: "" },
  { value: "max_handle_time", label: "Max Handle Time (seconds)", unit: "s" },
];

interface Props {
  businessId: string;
}

const SlaRulesTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState({ rule_type: "max_wait_time", threshold_value: "" });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["sla-rules", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_rules")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["sla-alerts", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_alerts")
        .select("*")
        .eq("business_id", businessId)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const addRule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sla_rules").insert({
        business_id: businessId,
        rule_type: newRule.rule_type,
        threshold_value: Number(newRule.threshold_value),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-rules", businessId] });
      setNewRule({ rule_type: "max_wait_time", threshold_value: "" });
      toast({ title: "SLA Rule Added" });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("sla_rules").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sla-rules", businessId] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sla_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sla-rules", businessId] }),
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sla_alerts").update({ acknowledged: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sla-alerts", businessId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" /> SLA Rules & Alerts
        </h3>
        <p className="text-sm text-muted-foreground">Define service-level thresholds and get alerted on violations</p>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-destructive" />
                <span className="text-sm text-foreground">{a.message}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "h:mm a")}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => acknowledgeAlert.mutate(a.id)}>Dismiss</Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Select value={newRule.rule_type} onValueChange={(v) => setNewRule({ ...newRule, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Input type="number" placeholder="Threshold" value={newRule.threshold_value} onChange={(e) => setNewRule({ ...newRule, threshold_value: e.target.value })} />
            </div>
            <Button size="sm" onClick={() => addRule.mutate()} disabled={!newRule.threshold_value}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid gap-2">
        {rules.map((r: any) => {
          const ruleType = RULE_TYPES.find((t) => t.value === r.rule_type);
          return (
            <Card key={r.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggleRule.mutate({ id: r.id, active: v })} />
                  <div>
                    <span className="text-sm font-medium text-foreground">{ruleType?.label || r.rule_type}</span>
                    <span className="text-sm text-muted-foreground ml-2">≤ {r.threshold_value}{ruleType?.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.is_active ? "default" : "secondary"} className="text-xs">
                    {r.is_active ? "Active" : "Disabled"}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteRule.mutate(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No SLA rules defined yet.</p>
        )}
      </div>
    </div>
  );
};

export default SlaRulesTab;
