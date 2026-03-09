import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Clock, Users, Activity } from "lucide-react";

interface ActiveCall {
  id: string;
  business_id: string;
  business_name?: string;
  caller_name: string | null;
  caller_number: string | null;
  direction: string;
  started_at: string;
  duration_seconds: number | null;
}

const LiveMonitoring = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [now, setNow] = useState(Date.now());

  // Poll current time for live duration display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active calls (no ended_at)
  const { data: calls = [] } = useQuery({
    queryKey: ["active-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*, businesses(name)")
        .is("ended_at", null)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data.map((c: any) => ({
        ...c,
        business_name: c.businesses?.name,
      }));
    },
    refetchInterval: 5000,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("live-calls")
      .on("postgres_changes", { event: "*", schema: "public", table: "call_logs" }, () => {
        // Refetch on any change
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setActiveCalls(calls);
  }, [calls]);

  const formatLiveDuration = (startedAt: string) => {
    const seconds = Math.floor((now - new Date(startedAt).getTime()) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Also fetch recent completed calls
  const { data: recentCalls = [] } = useQuery({
    queryKey: ["recent-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*, businesses(name)")
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data.map((c: any) => ({ ...c, business_name: c.businesses?.name }));
    },
    refetchInterval: 10000,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: async () => {
      const { count: totalToday } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .gte("started_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      const { count: businessCount } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

      return { totalToday: totalToday || 0, businessCount: businessCount || 0 };
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real-time view of all active calls across businesses</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCalls.length}</p>
                <p className="text-xs text-muted-foreground">Active Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalToday || 0}</p>
                <p className="text-xs text-muted-foreground">Calls Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.businessCount || 0}</p>
                <p className="text-xs text-muted-foreground">Active Businesses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">In Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Calls */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Active Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active calls right now</p>
          ) : (
            <div className="space-y-3">
              {activeCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{call.caller_name || call.caller_number || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{call.business_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>{call.direction}</Badge>
                    <span className="font-mono text-sm text-primary">{formatLiveDuration(call.started_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Recent Calls</CardTitle>
          <CardDescription>Last 20 completed calls</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent calls.</p>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call: any) => (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <PhoneOff className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{call.caller_name || call.caller_number || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{call.business_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{call.outcome || "completed"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, "0")}` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMonitoring;
