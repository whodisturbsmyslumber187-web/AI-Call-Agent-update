import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Megaphone, Trash2, Loader2, Play } from "lucide-react";

interface Props {
  businessId: string;
}

const CampaignsTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", script: "" });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, campaign_contacts(count)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").insert({
        ...form,
        business_id: businessId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", businessId] });
      setDialogOpen(false);
      setForm({ name: "", script: "" });
      toast({ title: "Campaign created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", businessId] });
    },
  });

  const statusColors: Record<string, string> = {
    draft: "secondary",
    active: "default",
    completed: "outline",
    paused: "secondary",
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Outbound Campaigns</h3>
          <p className="text-sm text-muted-foreground">Create and manage outbound call campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Follow-up calls" />
              </div>
              <div className="space-y-2">
                <Label>Call Script</Label>
                <Textarea
                  value={form.script}
                  onChange={(e) => setForm({ ...form, script: e.target.value })}
                  placeholder="What should the agent say? Include key points, offers, and call-to-action..."
                  className="min-h-[120px]"
                />
              </div>
              <Button className="w-full" onClick={() => createCampaign.mutate()} disabled={!form.name || createCampaign.isPending}>
                {createCampaign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !campaigns?.length ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center py-12">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No campaigns yet. Create one to start outbound calling.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c: any) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.campaign_contacts?.[0]?.count ?? 0} contacts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColors[c.status] as any || "secondary"} className="text-xs">
                    {c.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCampaign.mutate(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;
