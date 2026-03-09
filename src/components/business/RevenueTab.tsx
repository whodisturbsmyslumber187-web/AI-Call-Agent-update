import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Plus, Trash2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface Props {
  businessId: string;
}

const RevenueTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEntry, setNewEntry] = useState({ amount: "", source: "booking", description: "" });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["revenue", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("*")
        .eq("business_id", businessId)
        .order("entry_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("revenue_entries").insert({
        business_id: businessId,
        amount: Number(newEntry.amount),
        source: newEntry.source,
        description: newEntry.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue", businessId] });
      setNewEntry({ amount: "", source: "booking", description: "" });
      toast({ title: "Revenue entry added" });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("revenue_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenue", businessId] }),
  });

  // Chart data - last 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayTotal = entries
      .filter((e: any) => e.entry_date === dateStr)
      .reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { date: format(d, "MMM d"), revenue: dayTotal };
  });

  const totalRevenue = entries.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const thisMonthRevenue = entries
    .filter((e: any) => new Date(e.entry_date).getMonth() === new Date().getMonth())
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" /> Revenue Tracking
        </h3>
        <p className="text-sm text-muted-foreground">Track income from bookings, sales, and services</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-primary">${thisMonthRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue (30 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Add Entry */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4">
          <div className="flex items-end gap-3">
            <div className="w-28">
              <Input type="number" placeholder="Amount" value={newEntry.amount} onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })} />
            </div>
            <Select value={newEntry.source} onValueChange={(v) => setNewEntry({ ...newEntry, source: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input className="flex-1" placeholder="Description" value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} />
            <Button size="sm" onClick={() => addEntry.mutate()} disabled={!newEntry.amount}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="grid gap-1">
        {entries.slice(0, 30).map((e: any) => (
          <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">${Number(e.amount).toLocaleString()}</span>
              <Badge variant="outline" className="text-xs">{e.source}</Badge>
              <span className="text-sm text-foreground">{e.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{format(new Date(e.entry_date), "MMM d")}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteEntry.mutate(e.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueTab;
