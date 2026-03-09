import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  businessId: string;
}

const CallSummariesTab = ({ businessId }: Props) => {
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["call-summaries", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_summaries")
        .select("*, call_logs(caller_name, caller_number, started_at, duration_seconds)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> AI Call Summaries
        </h3>
        <p className="text-sm text-muted-foreground">Auto-generated summaries with action items after each call</p>
      </div>

      {summaries.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No call summaries yet. Summaries are generated automatically after calls end.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {summaries.map((s: any) => {
            const call = s.call_logs;
            const actionItems = Array.isArray(s.action_items) ? s.action_items : [];
            return (
              <Card key={s.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {call?.caller_name || call?.caller_number || "Unknown Caller"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {call?.started_at ? format(new Date(call.started_at), "MMM d, h:mm a") : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground">{s.summary}</p>

                  {s.key_topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.key_topics.map((t: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}

                  {actionItems.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Action Items:</p>
                      {actionItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {item.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                          )}
                          <span className={item.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                            {item.text || item}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CallSummariesTab;
