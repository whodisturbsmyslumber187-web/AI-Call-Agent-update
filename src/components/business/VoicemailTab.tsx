import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Voicemail, Play, RotateCcw, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
}

const VoicemailTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: voicemails, isLoading } = useQuery({
    queryKey: ["voicemails", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voicemails")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("voicemails").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voicemails", businessId] }),
  });

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500",
    listened: "bg-yellow-500/10 text-yellow-500",
    returned: "bg-green-500/10 text-green-500",
  };

  const newCount = voicemails?.filter(v => v.status === "new").length || 0;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Voicemail className="h-5 w-5 text-primary" /> Voicemail Inbox
          </h3>
          <p className="text-sm text-muted-foreground">{newCount} new voicemails</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !voicemails?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">No voicemails yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {voicemails.map((vm) => (
            <Card key={vm.id} className={`bg-card border-border ${vm.status === "new" ? "border-primary/30" : ""}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{vm.caller_name || "Unknown"}</span>
                      <span className="text-sm text-muted-foreground">{vm.caller_number || "No number"}</span>
                      <Badge variant="outline" className={statusColors[vm.status] || ""}>{vm.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{vm.transcription || "No transcription available"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(vm.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {vm.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: vm.id, status: "listened" })}>
                        <Play className="mr-1 h-3 w-3" /> Mark Listened
                      </Button>
                    )}
                    {vm.status === "listened" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: vm.id, status: "returned" })}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Mark Returned
                      </Button>
                    )}
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

export default VoicemailTab;
