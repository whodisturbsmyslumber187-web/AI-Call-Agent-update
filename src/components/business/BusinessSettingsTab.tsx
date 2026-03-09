import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

interface Props {
  business: any;
}

const BusinessSettingsTab = ({ business }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: business.name,
    industry: business.industry,
    voice: business.voice,
    greeting_message: business.greeting_message,
    instructions: business.instructions,
    knowledge_base: business.knowledge_base,
    status: business.status,
  });

  const updateBusiness = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("businesses")
        .update(form)
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", business.id] });
      toast({ title: "Saved", description: "Agent settings updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    },
  });

  return (
    <Card className="max-w-2xl bg-card border-border">
      <CardHeader>
        <CardTitle>Agent Configuration</CardTitle>
        <CardDescription>Set up how this business's AI agent behaves on calls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={form.voice} onValueChange={(v) => setForm({ ...form, voice: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Greeting Message</Label>
          <Textarea
            value={form.greeting_message}
            onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
            className="min-h-[60px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Agent Instructions</Label>
          <Textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="min-h-[100px]"
            placeholder="How should the agent handle calls? What should it ask? What should it avoid?"
          />
        </div>

        <div className="space-y-2">
          <Label>Knowledge Base</Label>
          <Textarea
            value={form.knowledge_base}
            onChange={(e) => setForm({ ...form, knowledge_base: e.target.value })}
            className="min-h-[160px]"
            placeholder="Menu items, services, pricing, hours, policies, FAQs — everything the agent needs to know..."
          />
          <p className="text-xs text-muted-foreground">
            Paste all relevant info here. The agent will use this to answer caller questions accurately.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => updateBusiness.mutate()} disabled={updateBusiness.isPending} className="w-full">
          {updateBusiness.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default BusinessSettingsTab;
