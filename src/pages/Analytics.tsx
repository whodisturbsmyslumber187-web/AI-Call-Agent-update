import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, Calendar, Users, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Analytics = () => {
  // Call volume last 7 days
  const { data: callVolume = [] } = useQuery({
    queryKey: ["analytics-call-volume"],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return { date: startOfDay(date).toISOString(), label: format(date, "EEE") };
      });

      const { data, error } = await supabase
        .from("call_logs")
        .select("started_at")
        .gte("started_at", days[0].date);
      if (error) throw error;

      return days.map((d) => {
        const dayStart = new Date(d.date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = (data || []).filter((c) => {
          const t = new Date(c.started_at);
          return t >= dayStart && t < dayEnd;
        }).length;
        return { name: d.label, calls: count };
      });
    },
  });

  // Reservation stats
  const { data: reservationStats } = useQuery({
    queryKey: ["analytics-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("status");
      if (error) throw error;
      const statusCounts: Record<string, number> = {};
      (data || []).forEach((r) => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
      return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    },
  });

  // Campaign stats
  const { data: campaignStats } = useQuery({
    queryKey: ["analytics-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_contacts")
        .select("call_status");
      if (error) throw error;
      const statusCounts: Record<string, number> = {};
      (data || []).forEach((c) => {
        statusCounts[c.call_status] = (statusCounts[c.call_status] || 0) + 1;
      });
      return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    },
  });

  // Summary stats
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const [calls, reservations, contacts, businesses] = await Promise.all([
        supabase.from("call_logs").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("*", { count: "exact", head: true }),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("businesses").select("*", { count: "exact", head: true }),
      ]);
      return {
        totalCalls: calls.count || 0,
        totalReservations: reservations.count || 0,
        totalContacts: contacts.count || 0,
        totalBusinesses: businesses.count || 0,
      };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground">Performance metrics across all businesses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Phone, label: "Total Calls", value: summary?.totalCalls, color: "text-green-500", bg: "bg-green-500/20" },
          { icon: Calendar, label: "Reservations", value: summary?.totalReservations, color: "text-blue-500", bg: "bg-blue-500/20" },
          { icon: Users, label: "Contacts", value: summary?.totalContacts, color: "text-purple-500", bg: "bg-purple-500/20" },
          { icon: TrendingUp, label: "Businesses", value: summary?.totalBusinesses, color: "text-orange-500", bg: "bg-orange-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Call Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={callVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Reservation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {reservationStats && reservationStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reservationStats} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {reservationStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No reservation data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Campaign Performance</CardTitle>
            <CardDescription>Contact call statuses across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignStats && campaignStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No campaign data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
