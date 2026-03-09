import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Users, Lightbulb, HelpCircle, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const typeIcons: Record<string, any> = {
  tip: Lightbulb,
  question: HelpCircle,
  insight: Sparkles,
};

const AgentHub = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name, industry");
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["agent-chat-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_chat_messages")
        .select("*, from_business:businesses!agent_chat_messages_from_business_id_fkey(name, industry)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const collaborate = useMutation({
    mutationFn: async (businessId: string) => {
      const { data, error } = await supabase.functions.invoke("agent-collaborate", {
        body: { business_id: businessId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-chat-messages"] });
      toast({ title: "Insights shared", description: "Agent insights have been broadcast." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("agent-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_chat_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["agent-chat-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Agent Hub
          </h1>
          <p className="text-sm text-muted-foreground">Cross-agent collaboration & swarm intelligence</p>
        </div>
        <div className="flex gap-2">
          {businesses?.map((b) => (
            <Button
              key={b.id}
              size="sm"
              variant="outline"
              onClick={() => collaborate.mutate(b.id)}
              disabled={collaborate.isPending}
            >
              {collaborate.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Share from {b.name}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !messages?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No agent conversations yet. Click "Share from" to have agents collaborate.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const Icon = typeIcons[msg.message_type] || MessageCircle;
            return (
              <Card key={msg.id} className="bg-card border-border">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{(msg as any).from_business?.name || "Agent"}</span>
                        <Badge variant="outline" className="text-xs">{msg.message_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentHub;
