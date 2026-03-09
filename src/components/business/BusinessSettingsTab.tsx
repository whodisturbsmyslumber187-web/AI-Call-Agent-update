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
const AGENT_MODES = [
  { value: "receptionist", label: "Receptionist", desc: "Handles inquiries, bookings, and support" },
  { value: "sales", label: "Sales Agent", desc: "Proactive selling, upselling, objection handling" },
  { value: "support", label: "Support Agent", desc: "Technical support and issue resolution" },
  { value: "hybrid", label: "Hybrid", desc: "Combines receptionist and sales capabilities" },
];

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
    agent_mode: business.agent_mode || "receptionist",
    sales_script: business.sales_script || "",
    objection_handling: business.objection_handling || "",
    upsell_prompts: business.upsell_prompts || "",
    closing_techniques: business.closing_techniques || "",
    default_language: business.default_language || "en",
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

  const showSalesFields = form.agent_mode === "sales" || form.agent_mode === "hybrid";

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-card border-border">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agent Mode</Label>
              <Select value={form.agent_mode} onValueChange={(v) => setForm({ ...form, agent_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {AGENT_MODES.find(m => m.value === form.agent_mode)?.desc}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select value={form.default_language} onValueChange={(v) => setForm({ ...form, default_language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
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
              placeholder="How should the agent handle calls?"
            />
          </div>

          <div className="space-y-2">
            <Label>Knowledge Base</Label>
            <Textarea
              value={form.knowledge_base}
              onChange={(e) => setForm({ ...form, knowledge_base: e.target.value })}
              className="min-h-[160px]"
              placeholder="Menu items, services, pricing, hours, policies, FAQs..."
            />
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
        </CardContent>
      </Card>

      {showSalesFields && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Sales Playbook</CardTitle>
            <CardDescription>Configure sales-specific agent behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sales Script</Label>
              <Textarea
                value={form.sales_script}
                onChange={(e) => setForm({ ...form, sales_script: e.target.value })}
                className="min-h-[100px]"
                placeholder="Opening pitch, value propositions, key selling points..."
              />
            </div>
            <div className="space-y-2">
              <Label>Objection Handling</Label>
              <Textarea
                value={form.objection_handling}
                onChange={(e) => setForm({ ...form, objection_handling: e.target.value })}
                className="min-h-[80px]"
                placeholder="Common objections and how to handle them..."
              />
            </div>
            <div className="space-y-2">
              <Label>Upsell Prompts</Label>
              <Textarea
                value={form.upsell_prompts}
                onChange={(e) => setForm({ ...form, upsell_prompts: e.target.value })}
                className="min-h-[80px]"
                placeholder="When and what to upsell..."
              />
            </div>
            <div className="space-y-2">
              <Label>Closing Techniques</Label>
              <Textarea
                value={form.closing_techniques}
                onChange={(e) => setForm({ ...form, closing_techniques: e.target.value })}
                className="min-h-[80px]"
                placeholder="How to close deals and confirm bookings..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => updateBusiness.mutate()} disabled={updateBusiness.isPending} className="w-full">
        {updateBusiness.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
};

export default BusinessSettingsTab;
