import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Tag } from "lucide-react";

interface Props { businessId: string; }

const dispositionOptions = [
  { value: "interested", label: "Interested", color: "default" },
  { value: "not_interested", label: "Not Interested", color: "secondary" },
  { value: "callback", label: "Callback Requested", color: "outline" },
  { value: "wrong_number", label: "Wrong Number", color: "destructive" },
  { value: "dnc", label: "Do Not Call", color: "destructive" },
  { value: "no_answer", label: "No Answer", color: "secondary" },
  { value: "voicemail_left", label: "Voicemail Left", color: "outline" },
  { value: "completed", label: "Completed", color: "default" },
];

const CallDispositionsTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: callLogs, isLoading } = useQuery({
    queryKey: ["call-dispositions", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("id, caller_name, caller_number, started_at, duration_seconds, direction, call_dispositions(*)")
        .eq("business_id", businessId)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const setDisposition = useMutation({
    mutationFn: async ({ callLogId, disposition }: { callLogId: string; disposition: string }) => {
      const { error } = await supabase.from("call_dispositions").upsert({
        call_log_id: callLogId,
        business_id: businessId,
        disposition,
      }, { onConflict: "call_log_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-dispositions", businessId] });
      toast({ title: "Disposition saved" });
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // Analytics
  const allDisps = callLogs?.flatMap((c: any) => c.call_dispositions || []) || [];
  const dispCounts = dispositionOptions.map(d => ({
    ...d,
    count: allDisps.filter((x: any) => x.disposition === d.value).length,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Call Dispositions</h3>
        <p className="text-sm text-muted-foreground">Tag each call with an outcome for analytics</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {dispCounts.filter(d => d.count > 0).map(d => (
          <Badge key={d.value} variant={d.color as any} className="text-xs">{d.label}: {d.count}</Badge>
        ))}
      </div>

      <div className="space-y-1">
        {callLogs?.map((call: any) => {
          const currentDisp = call.call_dispositions?.[0]?.disposition || "";
          return (
            <Card key={call.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{call.caller_name || call.caller_number || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(call.started_at).toLocaleString()} • {call.duration_seconds || 0}s • {call.direction}</p>
                  </div>
                </div>
                <Select value={currentDisp} onValueChange={v => setDisposition.mutate({ callLogId: call.id, disposition: v })}>
                  <SelectTrigger className="w-40 bg-secondary border-border text-xs"><SelectValue placeholder="Set disposition" /></SelectTrigger>
                  <SelectContent>
                    {dispositionOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CallDispositionsTab;
