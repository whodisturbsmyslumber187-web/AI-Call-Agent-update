import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Ban, Upload } from "lucide-react";

interface Props { businessId: string; }

const DncListTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPhones, setBulkPhones] = useState("");

  const { data: dncList, isLoading } = useQuery({
    queryKey: ["dnc-list", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("dnc_list").select("*").eq("business_id", businessId).order("added_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDnc = useMutation({
    mutationFn: async () => {
      if (bulkMode) {
        const phones = bulkPhones.split("\n").map(p => p.trim()).filter(Boolean);
        const entries = phones.map(p => ({ business_id: businessId, phone_number: p, reason }));
        const { error } = await supabase.from("dnc_list").upsert(entries, { onConflict: "business_id,phone_number" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dnc_list").upsert({ business_id: businessId, phone_number: phone, reason }, { onConflict: "business_id,phone_number" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dnc-list", businessId] });
      setDialogOpen(false);
      setPhone("");
      setReason("");
      setBulkPhones("");
      toast({ title: "DNC entry added" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const removeDnc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dnc_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dnc-list", businessId] }),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Do Not Call Registry</h3>
          <p className="text-sm text-muted-foreground">Numbers on this list will be skipped during bulk calling</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Number</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to DNC List</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button size="sm" variant={bulkMode ? "outline" : "default"} onClick={() => setBulkMode(false)}>Single</Button>
                <Button size="sm" variant={bulkMode ? "default" : "outline"} onClick={() => setBulkMode(true)}>Bulk Import</Button>
              </div>
              {bulkMode ? (
                <div className="space-y-2">
                  <Label>Phone Numbers (one per line)</Label>
                  <Textarea value={bulkPhones} onChange={e => setBulkPhones(e.target.value)} placeholder={"+15551234567\n+15559876543"} className="min-h-[120px] font-mono text-xs" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+15551234567" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Customer requested removal" />
              </div>
              <Button className="w-full" onClick={() => addDnc.mutate()} disabled={addDnc.isPending}>
                {addDnc.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}Add to DNC
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : !dncList?.length ? (
        <Card className="border-dashed border-2 border-border"><CardContent className="flex flex-col items-center py-12"><Ban className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-muted-foreground">DNC list is empty</p></CardContent></Card>
      ) : (
        <div className="space-y-1">
          {dncList.map((d: any) => (
            <Card key={d.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium font-mono text-foreground">{d.phone_number}</p>
                  <p className="text-xs text-muted-foreground">{d.reason || "No reason"} • {new Date(d.added_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeDnc.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DncListTab;
