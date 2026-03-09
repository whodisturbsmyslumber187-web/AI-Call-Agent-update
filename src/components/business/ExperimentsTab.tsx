import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Plus, Play, Square, Trophy, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props { businessId: string; }

const ExperimentsTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "", variant_a_instructions: "", variant_b_instructions: "", traffic_split: 50,
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["ab-tests", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ab_tests").insert({
        business_id: businessId, ...form,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests", businessId] });
      setShowNew(false);
      setForm({ name: "", variant_a_instructions: "", variant_b_instructions: "", traffic_split: 50 });
      toast({ title: "Experiment Created" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "running") updates.started_at = new Date().toISOString();
      if (status === "completed") updates.ended_at = new Date().toISOString();
      const { error } = await supabase.from("ab_tests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ab-tests", businessId] }),
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ab_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests", businessId] });
      toast({ title: "Experiment Deleted" });
    },
  });

  const statusColor = (s: string) => {
    if (s === "running") return "default";
    if (s === "completed") return "secondary";
    return "outline";
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" /> A/B Experiments</h2>
          <p className="text-sm text-muted-foreground">Split test different agent instructions to find what converts best.</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Experiment</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create A/B Experiment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Experiment Name</Label>
                <Input placeholder="e.g. Friendly vs Formal greeting" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Variant A Instructions</Label>
                <Textarea placeholder="Instructions for variant A..." value={form.variant_a_instructions} onChange={(e) => setForm({ ...form, variant_a_instructions: e.target.value })} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Variant B Instructions</Label>
                <Textarea placeholder="Instructions for variant B..." value={form.variant_b_instructions} onChange={(e) => setForm({ ...form, variant_b_instructions: e.target.value })} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Traffic Split: {form.traffic_split}% A / {100 - form.traffic_split}% B</Label>
                <Slider value={[form.traffic_split]} onValueChange={([v]) => setForm({ ...form, traffic_split: v })} min={10} max={90} step={5} />
              </div>
              <Button onClick={() => createTest.mutate()} disabled={!form.name || createTest.isPending} className="w-full">
                {createTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Experiment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No experiments yet. Create one to start A/B testing agent scripts.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test: any) => (
            <Card key={test.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{test.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(test.status) as any}>{test.status}</Badge>
                    {test.winner && <Badge className="bg-yellow-500/20 text-yellow-400"><Trophy className="h-3 w-3 mr-1" /> {test.winner}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs font-medium text-primary mb-1">Variant A ({test.traffic_split}%)</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{test.variant_a_instructions || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs font-medium text-primary mb-1">Variant B ({100 - test.traffic_split}%)</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{test.variant_b_instructions || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {test.status === "draft" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: test.id, status: "running" })}>
                      <Play className="mr-1 h-3.5 w-3.5" /> Start
                    </Button>
                  )}
                  {test.status === "running" && (
                    <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: test.id, status: "completed" })}>
                      <Square className="mr-1 h-3.5 w-3.5" /> Stop
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTest.mutate(test.id)}>
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

export default ExperimentsTab;
