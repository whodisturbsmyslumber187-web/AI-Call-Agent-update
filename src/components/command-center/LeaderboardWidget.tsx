import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

const LeaderboardWidget = () => {
  const { data: businesses } = useQuery({
    queryKey: ["leaderboard-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name, agent_mode");
      if (error) throw error;
      return data;
    },
  });

  const { data: callLogs } = useQuery({
    queryKey: ["leaderboard-calls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("call_logs").select("business_id, duration_seconds, outcome").limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: scores } = useQuery({
    queryKey: ["leaderboard-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_scores")
        .select("call_log_id, customer_satisfaction, agent_performance, call_logs(business_id)")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const leaderboard = (businesses || []).map((b) => {
    const bCalls = (callLogs || []).filter((c) => c.business_id === b.id);
    const bScores = (scores || []).filter((s: any) => s.call_logs?.business_id === b.id);
    const avgSat = bScores.length ? (bScores.reduce((s: number, c: any) => s + c.customer_satisfaction, 0) / bScores.length) : 0;
    const avgPerf = bScores.length ? (bScores.reduce((s: number, c: any) => s + c.agent_performance, 0) / bScores.length) : 0;
    const avgDuration = bCalls.length ? Math.round(bCalls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / bCalls.length) : 0;
    const completedRate = bCalls.length ? Math.round((bCalls.filter(c => c.outcome === "completed").length / bCalls.length) * 100) : 0;

    return {
      ...b,
      totalCalls: bCalls.length,
      avgSatisfaction: avgSat,
      avgPerformance: avgPerf,
      avgDuration,
      completedRate,
      score: (avgSat * 20) + (avgPerf * 20) + completedRate * 0.3 + Math.min(bCalls.length, 50) * 0.2,
    };
  }).sort((a, b) => b.score - a.score);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (i === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (i === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">#{i + 1}</span>;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" /> Agent Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((b, i) => (
            <div key={b.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-secondary/30"}`}>
              <div className="flex items-center gap-3">
                {rankIcon(i)}
                <div>
                  <span className="text-sm font-medium text-foreground">{b.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{b.totalCalls} calls</span>
                    <span>•</span>
                    <span>{b.completedRate}% completed</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.avgSatisfaction > 0 && (
                  <Badge variant="outline" className="text-xs">⭐ {b.avgSatisfaction.toFixed(1)}</Badge>
                )}
                <Badge variant={i === 0 ? "default" : "secondary"} className="text-xs">
                  {Math.round(b.score)} pts
                </Badge>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No agents to rank yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;
