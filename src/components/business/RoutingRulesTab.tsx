import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUpDown, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
}

const CONDITION_TYPES = [
  { value: "time", label: "Time-based" },
  { value: "caller", label: "Caller Number" },
  { value: "keyword", label: "Keyword" },
  { value: "department", label: "Department" },
];

const ACTIONS = [
  { value: "agent", label: "Route to Agent" },
  { value: "transfer", label: "Transfer to Phone" },
  { value: "voicemail", label: "Send to Voicemail" },
  { value: "queue", label: "Add to Queue" },
];

const RoutingRulesTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    condition_type: "time",
    condition_value: "",
    action: "agent",
    target: "",
    priority: 0,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["routing-rules", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_routing_rules")
        .select("*")
        .eq("business_id", businessId)
        .order("priority", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addRule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("call_routing_rules").insert({
        business_id: businessId,
        ...newRule,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routing-rules", businessId] });
      setShowAdd(false);
      setNewRule({ condition_type: "time", condition_value: "", action: "agent", target: "", priority: 0 });
      toast({ title: "Rule added" });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("call_routing_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routing-rules", businessId] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("call_routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routing-rules", businessId] }),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" /> Call Routing Rules
          </h3>
          <p className="text-sm text-muted-foreground">Route calls based on conditions like time, caller, or keywords</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-1 h-4 w-4" /> Add Rule
        </Button>
      </div>

      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Condition Type</Label>
                <Select value={newRule.condition_type} onValueChange={(v) => setNewRule({ ...newRule, condition_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Condition Value</Label>
                <Input
                  placeholder={newRule.condition_type === "time" ? "e.g. after_hours" : "e.g. emergency"}
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Action</Label>
                <Select value={newRule.action} onValueChange={(v) => setNewRule({ ...newRule, action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target</Label>
                <Input
                  placeholder="Phone number or agent ID"
                  value={newRule.target}
                  onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">Priority</Label>
              <Input type="number" value={newRule.priority} onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })} />
            </div>
            <Button size="sm" onClick={() => addRule.mutate()} disabled={addRule.isPending}>Save Rule</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !rules?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">No routing rules configured.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <Card key={rule.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6">#{rule.priority}</span>
                  <div>
                    <p className="text-sm font-medium">
                      If <Badge variant="outline">{rule.condition_type}</Badge> = "{rule.condition_value}" → <Badge variant="outline">{rule.action}</Badge> {rule.target}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, is_active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteRule.mutate(rule.id)}>
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

export default RoutingRulesTab;
