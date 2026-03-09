import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneIncoming, PhoneOff, Clock, Users, TrendingUp, Activity, BarChart3, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const CommandCenter = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);

  const { data: businesses } = useQuery({
    queryKey: ["cmd-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name, status, industry, agent_mode");
      if (error) throw error;
      return data;
    },
  });

  const { data: callLogs } = useQuery({
    queryKey: ["cmd-call-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: queue } = useQuery({
    queryKey: ["cmd-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_queue")
        .select("*")
        .eq("status", "waiting")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: approvals } = useQuery({
    queryKey: ["cmd-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("id")
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: reservations } = useQuery({
    queryKey: ["cmd-reservations-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reservations")
        .select("id")
        .eq("date", today);
      if (error) throw error;
      return data;
    },
  });

  const { data: scores } = useQuery({
    queryKey: ["cmd-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_scores")
        .select("sentiment, customer_satisfaction, agent_performance")
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Computed metrics
  const todayCalls = callLogs?.filter(c => new Date(c.started_at).toDateString() === now.toDateString()) || [];
  const activeCalls = callLogs?.filter(c => !c.ended_at) || [];
  const avgDuration = todayCalls.length > 0
    ? Math.round(todayCalls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / todayCalls.length)
    : 0;

  const sentimentData = scores ? [
    { name: "Positive", value: scores.filter(s => s.sentiment === "positive").length },
    { name: "Neutral", value: scores.filter(s => s.sentiment === "neutral").length },
    { name: "Negative", value: scores.filter(s => s.sentiment === "negative").length },
  ] : [];

  const avgSatisfaction = scores?.length
    ? (scores.reduce((s, c) => s + c.customer_satisfaction, 0) / scores.length).toFixed(1)
    : "N/A";

  // Hourly call volume
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    calls: todayCalls.filter(c => new Date(c.started_at).getHours() === i).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Command Center
          </h1>
          <p className="text-sm text-muted-foreground">{now.toLocaleTimeString()} • {businesses?.length || 0} agents online</p>
        </div>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard icon={Phone} label="Active Calls" value={activeCalls.length} color="text-green-500" />
        <MetricCard icon={PhoneIncoming} label="Today's Calls" value={todayCalls.length} color="text-primary" />
        <MetricCard icon={Clock} label="Avg Duration" value={`${avgDuration}s`} color="text-blue-500" />
        <MetricCard icon={Users} label="In Queue" value={queue?.length || 0} color="text-orange-500" />
        <MetricCard icon={Calendar} label="Bookings Today" value={reservations?.length || 0} color="text-purple-500" />
        <MetricCard icon={TrendingUp} label="Satisfaction" value={avgSatisfaction} color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Status Grid */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {businesses?.map((b) => {
                const agentCalls = todayCalls.filter(c => c.business_id === b.id);
                const isActive = activeCalls.some(c => c.business_id === b.id);
                return (
                  <div key={b.id} className={`rounded-lg border p-3 ${isActive ? "border-green-500/50 bg-green-500/5" : "border-border"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : b.status === "active" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                      <span className="text-sm font-medium truncate">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{b.agent_mode}</Badge>
                      <span>{agentCalls.length} calls</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Queue Widget */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Call Queue</CardTitle></CardHeader>
          <CardContent>
            {!queue?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Queue empty</p>
            ) : (
              <div className="space-y-2">
                {queue.map((q, i) => (
                  <div key={q.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-1">
                    <span>#{q.position} {q.caller_name || q.caller_number || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{q.estimated_wait ? `~${q.estimated_wait}s` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Call Volume */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Call Volume (Today)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Gauge */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sentiment Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {sentimentData.every(s => s.value === 0) ? (
              <p className="text-sm text-muted-foreground py-8">No scored calls yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {sentimentData.map((_, i) => <Cell key={i} fill={["#10b981", "#94a3b8", "#ef4444"][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {callLogs?.slice(0, 15).map((log) => (
              <div key={log.id} className="flex items-center gap-2 text-sm py-1 border-b border-border/30">
                {log.ended_at ? <PhoneOff className="h-3 w-3 text-muted-foreground" /> : <Phone className="h-3 w-3 text-green-500" />}
                <span className="text-muted-foreground text-xs">{new Date(log.started_at).toLocaleTimeString()}</span>
                <span className="text-foreground">{log.caller_name || log.caller_number || "Unknown"}</span>
                <Badge variant="outline" className="text-[10px]">{log.direction}</Badge>
                {log.outcome && <Badge variant="secondary" className="text-[10px]">{log.outcome}</Badge>}
                {log.duration_seconds && <span className="text-xs text-muted-foreground ml-auto">{log.duration_seconds}s</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) => (
  <Card className="bg-card border-border">
    <CardContent className="py-3 px-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default CommandCenter;
