import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Phone, Trash2, Loader2, Edit, Building2, Stethoscope, UtensilsCrossed, Scale, Settings, Copy } from "lucide-react";

interface Props {
  businessId: string;
}

interface IvrTemplate {
  type: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  greeting: string;
  options: { digit: string; label: string; action: string }[];
}

const IVR_TEMPLATES: IvrTemplate[] = [
  {
    type: "simple_2dept",
    name: "2-Department",
    icon: <Phone className="h-5 w-5" />,
    description: "Sales & Support — simple and effective",
    greeting: "Thank you for calling. Press 1 for Sales, Press 2 for Support.",
    options: [
      { digit: "1", label: "Sales", action: "ai_agent" },
      { digit: "2", label: "Support", action: "ai_agent" },
    ],
  },
  {
    type: "simple_3dept",
    name: "3-Department",
    icon: <Building2 className="h-5 w-5" />,
    description: "Sales, Support & Billing",
    greeting: "Thank you for calling. Press 1 for Sales, Press 2 for Support, Press 3 for Billing.",
    options: [
      { digit: "1", label: "Sales", action: "ai_agent" },
      { digit: "2", label: "Support", action: "ai_agent" },
      { digit: "3", label: "Billing", action: "ai_agent" },
    ],
  },
  {
    type: "full_5dept",
    name: "Full Office (5-dept)",
    icon: <Building2 className="h-5 w-5" />,
    description: "Sales, Support, Billing, Manager, Operator",
    greeting: "Thank you for calling. Press 1 for Sales, Press 2 for Support, Press 3 for Billing, Press 4 for a Manager, Press 0 for Operator.",
    options: [
      { digit: "1", label: "Sales", action: "ai_agent" },
      { digit: "2", label: "Support", action: "ai_agent" },
      { digit: "3", label: "Billing", action: "ai_agent" },
      { digit: "4", label: "Manager", action: "forward_to_human" },
      { digit: "0", label: "Operator", action: "forward_to_human" },
    ],
  },
  {
    type: "medical",
    name: "Medical Office",
    icon: <Stethoscope className="h-5 w-5" />,
    description: "Appointments, Pharmacy, Nurse, Billing, Emergency",
    greeting: "Thank you for calling. Press 1 for Appointments, Press 2 for Pharmacy, Press 3 for Nurse, Press 4 for Billing. For emergencies, please call 911.",
    options: [
      { digit: "1", label: "Appointments", action: "ai_agent" },
      { digit: "2", label: "Pharmacy", action: "forward_to_human" },
      { digit: "3", label: "Nurse Line", action: "forward_to_human" },
      { digit: "4", label: "Billing", action: "ai_agent" },
    ],
  },
  {
    type: "restaurant",
    name: "Restaurant",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    description: "Reservations, Takeout, Catering, Manager",
    greeting: "Thank you for calling. Press 1 for Reservations, Press 2 for Takeout Orders, Press 3 for Catering, Press 4 for Manager.",
    options: [
      { digit: "1", label: "Reservations", action: "ai_agent" },
      { digit: "2", label: "Takeout", action: "ai_agent" },
      { digit: "3", label: "Catering", action: "forward_to_human" },
      { digit: "4", label: "Manager", action: "forward_to_human" },
    ],
  },
  {
    type: "legal",
    name: "Legal Office",
    icon: <Scale className="h-5 w-5" />,
    description: "Consultation, Case Status, Billing, Reception",
    greeting: "Thank you for calling. Press 1 for Consultations, Press 2 for Case Status, Press 3 for Billing, Press 0 for Reception.",
    options: [
      { digit: "1", label: "Consultations", action: "ai_agent" },
      { digit: "2", label: "Case Status", action: "ai_agent" },
      { digit: "3", label: "Billing", action: "ai_agent" },
      { digit: "0", label: "Reception", action: "forward_to_human" },
    ],
  },
  {
    type: "custom",
    name: "Custom",
    icon: <Settings className="h-5 w-5" />,
    description: "Start blank and build your own",
    greeting: "Thank you for calling. Please listen to the following options.",
    options: [{ digit: "1", label: "Option 1", action: "ai_agent" }],
  },
];

const ACTION_OPTIONS = [
  { value: "ai_agent", label: "AI Agent" },
  { value: "forward_to_human", label: "Forward to Human" },
  { value: "voicemail", label: "Voicemail" },
  { value: "external_transfer", label: "External Transfer" },
];

const IvrMenuTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMenu, setEditMenu] = useState<any>(null);
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [editGreeting, setEditGreeting] = useState("");
  const [editName, setEditName] = useState("");
  const [editFallback, setEditFallback] = useState("agent");
  const [editTimeout, setEditTimeout] = useState(10);

  const { data: menus, isLoading } = useQuery({
    queryKey: ["ivr_menus", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ivr_menus")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createFromTemplate = useMutation({
    mutationFn: async (template: IvrTemplate) => {
      const { data: menu, error: menuError } = await supabase
        .from("ivr_menus")
        .insert({
          business_id: businessId,
          name: template.name,
          template_type: template.type,
          greeting_text: template.greeting,
        })
        .select()
        .single();
      if (menuError) throw menuError;

      const options = template.options.map((opt, i) => ({
        ivr_menu_id: menu.id,
        business_id: businessId,
        digit: opt.digit,
        label: opt.label,
        action: opt.action,
        priority: i,
      }));
      const { error: optError } = await supabase.from("ivr_options").insert(options);
      if (optError) throw optError;
      return menu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ivr_menus", businessId] });
      toast({ title: "IVR menu created from template" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openEdit = async (menu: any) => {
    setEditMenu(menu);
    setEditName(menu.name);
    setEditGreeting(menu.greeting_text);
    setEditFallback(menu.fallback_action);
    setEditTimeout(menu.timeout_seconds);
    const { data } = await supabase
      .from("ivr_options")
      .select("*")
      .eq("ivr_menu_id", menu.id)
      .order("priority");
    setEditOptions(data || []);
  };

  const saveMenu = useMutation({
    mutationFn: async () => {
      const { error: menuErr } = await supabase
        .from("ivr_menus")
        .update({
          name: editName,
          greeting_text: editGreeting,
          fallback_action: editFallback,
          timeout_seconds: editTimeout,
        })
        .eq("id", editMenu.id);
      if (menuErr) throw menuErr;

      // Delete old options and re-insert
      await supabase.from("ivr_options").delete().eq("ivr_menu_id", editMenu.id);
      if (editOptions.length > 0) {
        const opts = editOptions.map((o, i) => ({
          ivr_menu_id: editMenu.id,
          business_id: businessId,
          digit: o.digit,
          label: o.label,
          action: o.action,
          target_phone: o.target_phone || null,
          agent_instructions: o.agent_instructions || null,
          mask_caller_id: o.mask_caller_id || false,
          record_call: o.record_call !== false,
          priority: i,
        }));
        const { error } = await supabase.from("ivr_options").insert(opts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ivr_menus", businessId] });
      setEditMenu(null);
      toast({ title: "IVR menu saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ivr_menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ivr_menus", businessId] });
      toast({ title: "IVR menu deleted" });
    },
  });

  const updateOption = (index: number, field: string, value: any) => {
    setEditOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };

  const addOption = () => {
    const usedDigits = editOptions.map((o) => o.digit);
    const nextDigit = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "*", "#"].find(
      (d) => !usedDigits.includes(d)
    ) || "1";
    setEditOptions((prev) => [...prev, { digit: nextDigit, label: "", action: "ai_agent", mask_caller_id: false, record_call: true }]);
  };

  const removeOption = (index: number) => setEditOptions((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Template Gallery */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">IVR Phone Tree</h3>
        <p className="text-sm text-muted-foreground mb-4">Pick a template to create an IVR menu instantly, then customize it.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {IVR_TEMPLATES.map((t) => (
            <button
              key={t.type}
              onClick={() => createFromTemplate.mutate(t)}
              disabled={createFromTemplate.isPending}
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <div className="text-primary mb-2">{t.icon}</div>
              <p className="text-sm font-medium text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Menus */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !menus?.length ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center py-12">
            <Phone className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No IVR menus yet. Pick a template above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Your IVR Menus</h4>
          {menus.map((menu: any) => (
            <Card key={menu.id} className="bg-card border-border">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{menu.name}</p>
                    <Badge variant="secondary" className="text-xs">{menu.template_type}</Badge>
                    {menu.is_active && <Badge className="text-xs">Active</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{menu.greeting_text}</p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(menu)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const t = IVR_TEMPLATES.find((t) => t.type === menu.template_type) || IVR_TEMPLATES[6];
                    createFromTemplate.mutate({ ...t, name: `${menu.name} (Copy)` });
                  }}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMenu.mutate(menu.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editMenu} onOpenChange={(open) => !open && setEditMenu(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit IVR Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Menu Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Timeout (seconds)</Label>
                <Input type="number" value={editTimeout} onChange={(e) => setEditTimeout(Number(e.target.value))} min={3} max={30} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Greeting Text</Label>
              <Textarea value={editGreeting} onChange={(e) => setEditGreeting(e.target.value)} rows={3}
                placeholder="Thank you for calling. Press 1 for Sales..." />
              <p className="text-xs text-muted-foreground">This is what the caller hears. Mention each option.</p>
            </div>

            <div className="space-y-2">
              <Label>Fallback Action</Label>
              <Select value={editFallback} onValueChange={setEditFallback}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">AI Agent</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">What happens if the caller doesn't press anything</p>
            </div>

            {/* Options Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Keypress Options</Label>
                <Button size="sm" variant="outline" onClick={addOption}><Plus className="h-3 w-3 mr-1" />Add Option</Button>
              </div>
              <div className="space-y-3">
                {editOptions.map((opt, i) => (
                  <Card key={i} className="bg-secondary/30 border-border">
                    <CardContent className="p-3 space-y-3">
                      <div className="grid grid-cols-[60px,1fr,1fr,40px] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Digit</Label>
                          <Select value={opt.digit} onValueChange={(v) => updateOption(i, "digit", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["1","2","3","4","5","6","7","8","9","0","*","#"].map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input className="h-9" value={opt.label} onChange={(e) => updateOption(i, "label", e.target.value)} placeholder="Sales" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Action</Label>
                          <Select value={opt.action} onValueChange={(v) => updateOption(i, "action", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ACTION_OPTIONS.map((a) => (
                                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeOption(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {(opt.action === "forward_to_human" || opt.action === "external_transfer") && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Forward To Phone</Label>
                            <Input className="h-9" value={opt.target_phone || ""} onChange={(e) => updateOption(i, "target_phone", e.target.value)} placeholder="+1234567890" />
                          </div>
                          <div className="flex items-end gap-4 pb-1">
                            <div className="flex items-center gap-2">
                              <Switch checked={opt.mask_caller_id || false} onCheckedChange={(v) => updateOption(i, "mask_caller_id", v)} />
                              <Label className="text-xs">Mask Caller ID</Label>
                            </div>
                          </div>
                        </div>
                      )}

                      {opt.action === "ai_agent" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Agent Instructions (optional)</Label>
                          <Input className="h-9" value={opt.agent_instructions || ""} onChange={(e) => updateOption(i, "agent_instructions", e.target.value)} placeholder="You are the sales department..." />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Switch checked={opt.record_call !== false} onCheckedChange={(v) => updateOption(i, "record_call", v)} />
                        <Label className="text-xs">Record this call</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preview */}
            <Card className="bg-secondary/50 border-border">
              <CardContent className="py-3">
                <h4 className="text-xs font-medium text-foreground mb-1">Preview</h4>
                <p className="text-xs text-muted-foreground italic">"{editGreeting}"</p>
                <div className="mt-2 space-y-1">
                  {editOptions.map((opt, i) => (
                    <p key={i} className="text-xs text-foreground">
                      <span className="font-mono font-bold text-primary">Press {opt.digit}</span> → {opt.label}
                      <span className="text-muted-foreground ml-1">({ACTION_OPTIONS.find((a) => a.value === opt.action)?.label})</span>
                      {opt.mask_caller_id && <Badge variant="outline" className="ml-1 text-[10px] py-0">Masked</Badge>}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => saveMenu.mutate()} disabled={saveMenu.isPending}>
              {saveMenu.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save IVR Menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IvrMenuTab;
