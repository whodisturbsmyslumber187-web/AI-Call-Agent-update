import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save, Loader2, PhoneIncoming, Shield } from "lucide-react";
import { useState, useEffect } from "react";

interface Props { businessId: string; }

const InboundCapacityTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    max_concurrent_calls: 10,
    overflow_action: "queue",
    overflow_target: "",
    auto_scale: false,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["inbound-capacity", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbound_capacity_config")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) setForm({
      max_concurrent_calls: config.max_concurrent_calls,
      overflow_action: config.overflow_action,
      overflow_target: config.overflow_target,
      auto_scale: config.auto_scale,
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inbound_capacity_config").upsert({
        business_id: businessId,
        ...form,
      }, { onConflict: "business_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbound-capacity", businessId] });
      toast({ title: "Inbound capacity saved" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card className="bg-card border-border max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground"><PhoneIncoming className="h-5 w-5 text-primary" />Inbound Capacity</CardTitle>
        <CardDescription>Configure how many simultaneous inbound calls this business can handle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Max Concurrent Calls: {form.max_concurrent_calls}</Label>
          <Slider value={[form.max_concurrent_calls]} onValueChange={v => setForm({ ...form, max_concurrent_calls: v[0] })} min={1} max={100} step={1} />
        </div>
        <div className="space-y-2">
          <Label>Overflow Action</Label>
          <Select value={form.overflow_action} onValueChange={v => setForm({ ...form, overflow_action: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="queue">Queue (hold)</SelectItem>
              <SelectItem value="voicemail">Send to Voicemail</SelectItem>
              <SelectItem value="transfer">Transfer to Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.overflow_action === "transfer" && (
          <div className="space-y-2">
            <Label>Transfer To</Label>
            <Input value={form.overflow_target} onChange={e => setForm({ ...form, overflow_target: e.target.value })} placeholder="+15551234567" className="bg-secondary border-border" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Label>Auto-Scale</Label>
          <Switch checked={form.auto_scale} onCheckedChange={v => setForm({ ...form, auto_scale: v })} />
        </div>
        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
        </Button>
      </CardContent>
    </Card>
  );
};

export default InboundCapacityTab;
