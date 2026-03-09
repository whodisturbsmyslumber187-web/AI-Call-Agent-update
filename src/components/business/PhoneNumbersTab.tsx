import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Phone, Trash2, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
}

const PhoneNumbersTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    phone_number: "",
    provider: "manual",
    provider_sid: "",
    label: "",
    direction: "inbound",
  });

  const { data: numbers, isLoading } = useQuery({
    queryKey: ["phone_numbers", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNumber = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("phone_numbers").insert({
        ...form,
        business_id: businessId,
        provider_sid: form.provider_sid || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone_numbers", businessId] });
      setDialogOpen(false);
      setForm({ phone_number: "", provider: "manual", provider_sid: "", label: "", direction: "inbound" });
      toast({ title: "Phone number added" });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message?.includes("unique") ? "This number is already registered" : "Failed to add number",
        variant: "destructive",
      });
    },
  });

  const deleteNumber = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("phone_numbers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone_numbers", businessId] });
      toast({ title: "Phone number removed" });
    },
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Phone Numbers</h3>
          <p className="text-sm text-muted-foreground">Import numbers from Twilio, Vonage, or add manually</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Number</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Phone Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+1234567890"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.provider !== "manual" && (
                <div className="space-y-2">
                  <Label>Provider SID / ID</Label>
                  <Input
                    placeholder={form.provider === "twilio" ? "PN..." : "Number ID"}
                    value={form.provider_sid}
                    onChange={(e) => setForm({ ...form, provider_sid: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.provider === "twilio"
                      ? "Find this in your Twilio console under Phone Numbers"
                      : "Find this in your Vonage dashboard under Numbers"}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="Main line, Support, etc."
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={() => addNumber.mutate()} disabled={!form.phone_number || addNumber.isPending}>
                {addNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Number
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !numbers?.length ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center py-12">
            <Phone className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No phone numbers yet. Add one to start receiving calls.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {numbers.map((num: any) => (
            <Card key={num.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-mono text-sm text-foreground">{num.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {num.label && `${num.label} • `}{num.provider} • {num.direction}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={num.status === "active" ? "default" : "secondary"} className="text-xs">
                    {num.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNumber.mutate(num.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-secondary/50 border-border">
        <CardContent className="py-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Webhook Setup</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Point your Twilio/Vonage webhook to this URL for incoming calls:
          </p>
          <code className="text-xs bg-background px-3 py-2 rounded block text-primary break-all">
            {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/twilio-voice/twiml`}
          </code>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumbersTab;
