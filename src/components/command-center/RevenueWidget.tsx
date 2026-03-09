import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const RevenueWidget = () => {
  const { data: entries = [] } = useQuery({
    queryKey: ["revenue-widget"],
    queryFn: async () => {
      const since = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("amount, entry_date")
        .gte("entry_date", since);
      if (error) throw error;
      return data;
    },
  });

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const total = entries
      .filter((e: any) => e.entry_date === dateStr)
      .reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { day: format(d, "EEE"), revenue: total };
  });

  const weekTotal = entries.reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Revenue (7 Days)
          </CardTitle>
          <span className="text-lg font-bold text-primary">${weekTotal.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueWidget;
