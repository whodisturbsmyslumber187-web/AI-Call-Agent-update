import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REPORT_TYPES = [
  { value: "daily_summary", label: "Daily Summary" },
  { value: "weekly_analytics", label: "Weekly Analytics" },
  { value: "monthly_revenue", label: "Monthly Revenue" },
  { value: "sla_violations", label: "SLA Violations" },
  { value: "lead_pipeline", label: "Lead Pipeline" },
];

const ScheduledReportsSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["scheduled-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_reports")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const [newReport, setNewReport] = useState({ report_type: "daily_summary", frequency: "weekly", recipients: "" });

  const addReport = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scheduled_reports").insert({
        user_id: user!.id,
        report_type: newReport.report_type,
        frequency: newReport.frequency,
        recipients: newReport.recipients.split(",").map((r) => r.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      setNewReport({ report_type: "daily_summary", frequency: "weekly", recipients: "" });
      toast({ title: "Report Scheduled" });
    },
  });

  const toggleReport = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("scheduled_reports").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] }),
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      toast({ title: "Report Removed" });
    },
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Scheduled Reports
        </CardTitle>
        <CardDescription>Configure automated reports delivered to your email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={newReport.report_type} onValueChange={(v) => setNewReport({ ...newReport, report_type: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newReport.frequency} onValueChange={(v) => setNewReport({ ...newReport, frequency: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="email1, email2" value={newReport.recipients} onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })} className="bg-secondary border-border" />
          <Button onClick={() => addReport.mutate()} disabled={addReport.isPending}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No scheduled reports. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggleReport.mutate({ id: r.id, is_active: v })} />
                  <div>
                    <span className="text-sm font-medium">{REPORT_TYPES.find((t) => t.value === r.report_type)?.label || r.report_type}</span>
                    <span className="text-xs text-muted-foreground ml-2">({r.frequency})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{(r.recipients || []).length} recipients</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteReport.mutate(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledReportsSection;
