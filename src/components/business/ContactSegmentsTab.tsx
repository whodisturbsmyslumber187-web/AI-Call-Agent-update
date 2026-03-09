import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Filter, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props { businessId: string; }

const ContactSegmentsTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState({ min_lead_score: 0, lead_status: "", tag: "" });

  const { data: segments, isLoading } = useQuery({
    queryKey: ["contact-segments", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_segments").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSegment = useMutation({
    mutationFn: async () => {
      const filterCriteria: Record<string, any> = {};
      if (criteria.min_lead_score > 0) filterCriteria.min_lead_score = criteria.min_lead_score;
      if (criteria.lead_status) filterCriteria.lead_status = criteria.lead_status;
      if (criteria.tag) filterCriteria.tag = criteria.tag;
      const { error } = await supabase.from("contact_segments").insert({ business_id: businessId, name, filter_criteria: filterCriteria });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-segments", businessId] });
      setDialogOpen(false);
      setName("");
      setCriteria({ min_lead_score: 0, lead_status: "", tag: "" });
      toast({ title: "Segment created" });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-segments", businessId] }),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Contact Segments</h3>
          <p className="text-sm text-muted-foreground">Filter contacts into segments for targeted campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />New Segment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Segment</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Segment Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Hot leads" /></div>
              <div className="space-y-2">
                <Label>Min Lead Score</Label>
                <Input type="number" value={criteria.min_lead_score} onChange={e => setCriteria({ ...criteria, min_lead_score: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Lead Status</Label>
                <Select value={criteria.lead_status} onValueChange={v => setCriteria({ ...criteria, lead_status: v })}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Tag</Label><Input value={criteria.tag} onChange={e => setCriteria({ ...criteria, tag: e.target.value })} placeholder="vip" /></div>
              <Button className="w-full" onClick={() => createSegment.mutate()} disabled={!name || createSegment.isPending}>
                {createSegment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}Create Segment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : !segments?.length ? (
        <Card className="border-dashed border-2 border-border"><CardContent className="flex flex-col items-center py-12"><Users className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-muted-foreground">No segments yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {segments.map((s: any) => (
            <Card key={s.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <div className="flex gap-1 mt-1">
                      {Object.entries(s.filter_criteria || {}).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-[10px]">{k}: {String(v)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSegment.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactSegmentsTab;
