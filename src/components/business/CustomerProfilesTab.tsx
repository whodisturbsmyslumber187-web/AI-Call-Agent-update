import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Loader2, Phone, Mail, Tag } from "lucide-react";
import { useState } from "react";

interface Props {
  businessId: string;
}

const CustomerProfilesTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newProfile, setNewProfile] = useState({ name: "", phone: "", email: "", notes: "" });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["customer-profiles", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("business_id", businessId)
        .order("last_contact_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const addProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customer_profiles").insert({
        business_id: businessId,
        ...newProfile,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-profiles", businessId] });
      setNewProfile({ name: "", phone: "", email: "", notes: "" });
      setShowAdd(false);
      toast({ title: "Profile created" });
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-profiles", businessId] }),
  });

  const filtered = profiles?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Customer Profiles
          </h3>
          <p className="text-sm text-muted-foreground">{profiles?.length || 0} customers tracked</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>

      <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Name" value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} />
              <Input placeholder="Phone" value={newProfile.phone} onChange={(e) => setNewProfile({ ...newProfile, phone: e.target.value })} />
              <Input placeholder="Email" value={newProfile.email} onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })} />
              <Input placeholder="Notes" value={newProfile.notes} onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })} />
            </div>
            <Button size="sm" onClick={() => addProfile.mutate()} disabled={addProfile.isPending}>Save</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !filtered?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-8 text-center text-muted-foreground">No customer profiles yet.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <Card key={p.id} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <Badge variant="outline" className={
                      (p.sentiment_score || 0) > 0.5 ? "bg-green-500/10 text-green-500" :
                      (p.sentiment_score || 0) < -0.5 ? "bg-red-500/10 text-red-500" :
                      "bg-muted text-muted-foreground"
                    }>
                      Sentiment: {((p.sentiment_score || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                    {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
                    <span>{p.total_calls} calls</span>
                    <span>${Number(p.total_spend || 0).toFixed(2)} spent</span>
                    {p.tags?.length > 0 && p.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProfile.mutate(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerProfilesTab;
