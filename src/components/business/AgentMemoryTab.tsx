import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Check, X, Plus, Loader2, Sparkles } from "lucide-react";

interface Props {
  businessId: string;
}

const AgentMemoryTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLearning, setNewLearning] = useState({ trigger_phrase: "", learned_response: "", category: "faq" });
  const [showAdd, setShowAdd] = useState(false);

  const { data: learnings, isLoading } = useQuery({
    queryKey: ["agent-learnings", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_learnings")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addLearning = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agent_learnings").insert({
        business_id: businessId,
        ...newLearning,
        source: "manual",
        status: "approved",
        confidence: 1.0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-learnings", businessId] });
      setNewLearning({ trigger_phrase: "", learned_response: "", category: "faq" });
      setShowAdd(false);
      toast({ title: "Added", description: "Learning added to agent memory." });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agent_learnings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-learnings", businessId] }),
  });

  const deleteLearning = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_learnings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-learnings", businessId] }),
  });

  const extractLearnings = useMutation({
    mutationFn: async () => {
      // Get recent call logs with transcripts
      const { data: calls } = await supabase
        .from("call_logs")
        .select("transcript")
        .eq("business_id", businessId)
        .not("transcript", "is", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!calls || calls.length === 0) throw new Error("No call transcripts available");

      const transcript = calls.map(c => c.transcript).join("\n---\n");
      const { data, error } = await supabase.functions.invoke("extract-learnings", {
        body: { business_id: businessId, transcript },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent-learnings", businessId] });
      toast({ title: "Extracted", description: `Found ${data?.learnings?.length || 0} new learnings from calls.` });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const categoryColors: Record<string, string> = {
    faq: "bg-blue-500/10 text-blue-500",
    objection: "bg-orange-500/10 text-orange-500",
    preference: "bg-green-500/10 text-green-500",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Agent Memory
          </h3>
          <p className="text-sm text-muted-foreground">What your agent has learned from calls and manual entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => extractLearnings.mutate()} disabled={extractLearnings.isPending}>
            {extractLearnings.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Extract from Calls
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 h-4 w-4" /> Add Learning
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Select value={newLearning.category} onValueChange={(v) => setNewLearning({ ...newLearning, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="objection">Objection</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="col-span-2"
                placeholder="Trigger phrase (e.g. 'Do you have parking?')"
                value={newLearning.trigger_phrase}
                onChange={(e) => setNewLearning({ ...newLearning, trigger_phrase: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Agent should respond with..."
              value={newLearning.learned_response}
              onChange={(e) => setNewLearning({ ...newLearning, learned_response: e.target.value })}
            />
            <Button size="sm" onClick={() => addLearning.mutate()} disabled={addLearning.isPending}>Save</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !learnings?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No learnings yet. Add manually or extract from call transcripts.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {learnings.map((l) => (
            <Card key={l.id} className="bg-card border-border">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={categoryColors[l.category] || ""}>{l.category}</Badge>
                      <Badge variant="outline" className={statusColors[l.status] || ""}>{l.status}</Badge>
                      <span className="text-xs text-muted-foreground">Confidence: {Math.round((l.confidence || 0) * 100)}%</span>
                      <span className="text-xs text-muted-foreground">Source: {l.source}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">"{l.trigger_phrase}"</p>
                    <p className="text-sm text-muted-foreground">→ {l.learned_response}</p>
                  </div>
                  <div className="flex gap-1">
                    {l.status === "pending" && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => updateStatus.mutate({ id: l.id, status: "approved" })}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => updateStatus.mutate({ id: l.id, status: "rejected" })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => deleteLearning.mutate(l.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentMemoryTab;
