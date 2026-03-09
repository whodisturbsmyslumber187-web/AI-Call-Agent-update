import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";
import { format } from "date-fns";

interface Props {
  businessId: string;
}

const CallLogsTab = ({ businessId }: Props) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["call-logs", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .eq("business_id", businessId)
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const outcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case "completed": return "default";
      case "missed": return "destructive";
      case "voicemail": return "secondary";
      default: return "outline" as const;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Call History ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No call logs yet. Calls will appear here automatically.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.direction === "inbound" ? (
                        <PhoneIncoming className="h-4 w-4 text-green-500" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm">{log.caller_name || "Unknown"}</span>
                        {log.caller_number && (
                          <p className="text-xs text-muted-foreground">{log.caller_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatDuration(log.duration_seconds)}</TableCell>
                    <TableCell>
                      <Badge variant={outcomeColor(log.outcome)}>{log.outcome || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.started_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      {log.recording_url ? (
                        <a href={log.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Listen
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallLogsTab;
