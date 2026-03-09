import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Play, Pause, X, RotateCcw, Voicemail, Phone, MessageSquare, PhoneCall, Zap, Loader2 } from "lucide-react";

const JOB_TYPES = [
  { value: "rvm", label: "Ringless Voicemail", icon: Voicemail, description: "Drop voicemails directly without ringing" },
  { value: "one_ring", label: "One-Ring Callback", icon: Phone, description: "Missed call triggers callback to your AI agent" },
  { value: "bulk_sms", label: "Bulk SMS", icon: MessageSquare, description: "Mass text campaigns with variable substitution" },
  { value: "press_1", label: "Press-1 IVR", icon: PhoneCall, description: "Play message, press 1 to connect live" },
  { value: "speed_to_lead", label: "Speed-to-Lead", icon: Zap, description: "Auto-dial new leads within seconds" },
] as const;

const statusColors: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  running: "bg-blue-500/20 text-blue-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function MarketingCampaignsTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [jobType, setJobType] = useState<string>("rvm");
  const [name, setName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [callerId, setCallerId] = useState("");
  const [callbackNumber, setCallbackNumber] = useState("");
  const [ringCount, setRingCount] = useState("1");
  const [concurrency, setConcurrency] = useState("5");
  const [rate, setRate] = useState("10");
  const [csvText, setCsvText] = useState("");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["marketing-jobs", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_marketing_jobs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createJob = useMutation({
    mutationFn: async () => {
      const lines = csvText.trim().split("\n").filter(Boolean);
      const contacts = lines.map(line => {
        const [contactName, phone] = line.split(",").map(s => s.trim());
        return { contact_name: contactName || "", contact_phone: phone || contactName || "" };
      });

      const { data: job, error } = await supabase.from("bulk_marketing_jobs").insert({
        business_id: businessId,
        name,
        job_type: jobType,
        message_content: messageContent,
        caller_id: callerId,
        callback_number: callbackNumber,
        ring_count: parseInt(ringCount),
        concurrency_limit: parseInt(concurrency),
        rate_per_minute: parseInt(rate),
        total_contacts: contacts.length,
      }).select().single();
      if (error) throw error;

      const entries = contacts.map(c => ({
        job_id: job.id,
        business_id: businessId,
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
      }));

      const { error: entryError } = await supabase.from("bulk_marketing_entries").insert(entries);
      if (entryError) throw entryError;

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-jobs", businessId] });
      toast.success("Marketing job created");
      setOpen(false);
      setName(""); setMessageContent(""); setCsvText(""); setCallerId(""); setCallbackNumber("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const executeAction = useMutation({
    mutationFn: async ({ action, jobId }: { action: string; jobId: string }) => {
      const { data, error } = await supabase.functions.invoke("bulk-marketing", {
        body: { action, job_id: jobId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["marketing-jobs", businessId] });
      toast.success(`Action "${vars.action}" executed`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedType = JOB_TYPES.find(t => t.value === jobType);

  return (
    <div className="space-y-6">
      {/* Technique Guide Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {JOB_TYPES.map(t => (
          <Card key={t.value} className="border-border/50">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <t.icon className="h-6 w-6 text-primary" />
              <p className="text-sm font-semibold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header + Create */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Marketing Jobs</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Marketing Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Job Type</label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && <p className="text-xs text-muted-foreground mt-1">{selectedType.description}</p>}
              </div>
              <Input placeholder="Job name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Caller ID (outbound number)" value={callerId} onChange={e => setCallerId(e.target.value)} />

              {(jobType === "rvm" || jobType === "press_1") && (
                <Textarea placeholder="Voicemail script / audio message content" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
              )}
              {jobType === "bulk_sms" && (
                <Textarea placeholder="SMS body — use {name} and {business} for variables" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
              )}
              {jobType === "one_ring" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Ring count</label>
                    <Select value={ringCount} onValueChange={setRingCount}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ring</SelectItem>
                        <SelectItem value="2">2 rings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Callback number</label>
                    <Input value={callbackNumber} onChange={e => setCallbackNumber(e.target.value)} placeholder="+1..." />
                  </div>
                </div>
              )}
              {jobType === "speed_to_lead" && (
                <Input placeholder="Webhook/form source URL" value={callbackNumber} onChange={e => setCallbackNumber(e.target.value)} />
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Concurrency</label>
                  <Input type="number" min="1" max="50" value={concurrency} onChange={e => setConcurrency(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rate/min</label>
                  <Input type="number" min="1" max="100" value={rate} onChange={e => setRate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Contacts (CSV: name, phone)</label>
                <Textarea rows={5} placeholder={"John Doe, +14155551234\nJane Smith, +14155555678"} value={csvText} onChange={e => setCsvText(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createJob.mutate()} disabled={!name || !csvText || createJob.isPending}>
                {createJob.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Create Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !jobs?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No marketing jobs yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const pct = job.total_contacts > 0 ? Math.round(((job.completed + job.failed) / job.total_contacts) * 100) : 0;
            const typeInfo = JOB_TYPES.find(t => t.value === job.job_type);
            const TypeIcon = typeInfo?.icon || Voicemail;
            return (
              <Card key={job.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{job.name}</span>
                      <Badge variant="outline" className="text-xs">{typeInfo?.label}</Badge>
                      <Badge className={statusColors[job.status] || ""}>{job.status}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {job.status === "queued" && (
                        <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "start", jobId: job.id })}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === "running" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "start", jobId: job.id })}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "pause", jobId: job.id })}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {job.status === "paused" && (
                        <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "start", jobId: job.id })}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {["queued", "running", "paused"].includes(job.status) && (
                        <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "cancel", jobId: job.id })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {job.failed > 0 && (
                        <Button size="icon" variant="ghost" onClick={() => executeAction.mutate({ action: "retry_failed", jobId: job.id })}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Total: {job.total_contacts}</span>
                    <span className="text-green-400">Delivered: {job.completed}</span>
                    <span className="text-destructive">Failed: {job.failed}</span>
                    <span className="text-blue-400">Processing: {job.in_progress}</span>
                    <span>Rate: {job.rate_per_minute}/min</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
