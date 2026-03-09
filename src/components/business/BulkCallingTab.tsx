import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, Play, Pause, Square, RotateCcw, Loader2, Phone, PhoneOff, Users, Zap } from "lucide-react";

interface Props { businessId: string; }

const BulkCallingTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [jobName, setJobName] = useState("");
  const [concurrency, setConcurrency] = useState([5]);
  const [cpm, setCpm] = useState([10]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["bulk-jobs", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_call_jobs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const createJob = useMutation({
    mutationFn: async () => {
      const lines = csvData.trim().split("\n").filter(l => l.trim());
      const contacts = lines.map(l => {
        const [name, phone] = l.split(",").map(s => s.trim());
        return { contact_name: name || "", contact_phone: phone || name || "" };
      });
      if (!contacts.length) throw new Error("No contacts");

      const { data: job, error } = await supabase.from("bulk_call_jobs").insert({
        business_id: businessId,
        name: jobName || `Bulk Job ${new Date().toLocaleDateString()}`,
        total_contacts: contacts.length,
        concurrency_limit: concurrency[0],
        calls_per_minute: cpm[0],
      }).select().single();
      if (error) throw error;

      const entries = contacts.map(c => ({
        job_id: job.id,
        business_id: businessId,
        ...c,
      }));
      const { error: entryError } = await supabase.from("bulk_call_entries").insert(entries);
      if (entryError) throw entryError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bulk-jobs", businessId] });
      setDialogOpen(false);
      setCsvData("");
      setJobName("");
      toast({ title: "Bulk job created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const jobAction = useMutation({
    mutationFn: async ({ action, job_id }: { action: string; job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("bulk-dialer", {
        body: { action, job_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["bulk-jobs", businessId] });
      toast({ title: `Job ${vars.action}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusColors: Record<string, string> = {
    queued: "secondary",
    running: "default",
    paused: "outline",
    completed: "secondary",
    cancelled: "destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Bulk Calling</h3>
          <p className="text-sm text-muted-foreground">Mass outbound calling with CSV upload & concurrency controls</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Bulk Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Bulk Call Job</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Job Name</Label>
                <Input value={jobName} onChange={e => setJobName(e.target.value)} placeholder="Q1 Follow-ups" />
              </div>
              <div className="space-y-2">
                <Label>Contacts (CSV: name, phone — one per line)</Label>
                <Textarea value={csvData} onChange={e => setCsvData(e.target.value)} placeholder={"John Doe, +15551234567\nJane Smith, +15559876543"} className="min-h-[120px] font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Concurrency: {concurrency[0]} simultaneous</Label>
                <Slider value={concurrency} onValueChange={setConcurrency} min={1} max={50} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Rate: {cpm[0]} calls/min</Label>
                <Slider value={cpm} onValueChange={setCpm} min={1} max={60} step={1} />
              </div>
              <Button className="w-full" onClick={() => createJob.mutate()} disabled={!csvData.trim() || createJob.isPending}>
                {createJob.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Create Job ({csvData.trim().split("\n").filter(l => l.trim()).length} contacts)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !jobs?.length ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center py-12">
            <Zap className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No bulk jobs yet. Upload a CSV to start mass calling.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => {
            const progress = job.total_contacts > 0 ? Math.round(((job.completed + job.failed) / job.total_contacts) * 100) : 0;
            return (
              <Card key={job.id} className="bg-card border-border">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{job.name}</p>
                      <p className="text-xs text-muted-foreground">{job.total_contacts} contacts • {job.concurrency_limit} concurrent • {job.calls_per_minute}/min</p>
                    </div>
                    <Badge variant={statusColors[job.status] as any || "secondary"}>{job.status}</Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-green-500" />{job.completed} completed</span>
                    <span className="flex items-center gap-1"><PhoneOff className="h-3 w-3 text-destructive" />{job.failed} failed</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3 text-primary" />{job.in_progress} in progress</span>
                    <span>{job.total_contacts - job.completed - job.failed - job.in_progress} pending</span>
                  </div>
                  <div className="flex gap-2">
                    {job.status === "queued" && (
                      <Button size="sm" variant="default" onClick={() => jobAction.mutate({ action: "start", job_id: job.id })}><Play className="mr-1 h-3 w-3" />Start</Button>
                    )}
                    {job.status === "running" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => jobAction.mutate({ action: "start", job_id: job.id })}><Play className="mr-1 h-3 w-3" />Next Batch</Button>
                        <Button size="sm" variant="secondary" onClick={() => jobAction.mutate({ action: "pause", job_id: job.id })}><Pause className="mr-1 h-3 w-3" />Pause</Button>
                        <Button size="sm" variant="destructive" onClick={() => jobAction.mutate({ action: "cancel", job_id: job.id })}><Square className="mr-1 h-3 w-3" />Cancel</Button>
                      </>
                    )}
                    {job.status === "paused" && (
                      <Button size="sm" variant="default" onClick={() => jobAction.mutate({ action: "start", job_id: job.id })}><Play className="mr-1 h-3 w-3" />Resume</Button>
                    )}
                    {job.failed > 0 && (
                      <Button size="sm" variant="outline" onClick={() => jobAction.mutate({ action: "retry_failed", job_id: job.id })}><RotateCcw className="mr-1 h-3 w-3" />Retry Failed</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BulkCallingTab;
