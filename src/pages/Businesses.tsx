import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Building2,
  Phone,
  Settings,
  Loader2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const INDUSTRIES = [
  "restaurant",
  "dental",
  "medical",
  "salon",
  "legal",
  "real_estate",
  "automotive",
  "other",
];

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

const Businesses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "restaurant",
    timezone: "America/New_York",
    instructions: "You are a friendly and professional receptionist.",
    knowledge_base: "",
    greeting_message: "Thank you for calling. How can I help you today?",
    voice: "alloy",
  });

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, phone_numbers(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createBusiness = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("businesses").insert({
        ...form,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      setDialogOpen(false);
      setForm({
        name: "",
        industry: "restaurant",
        timezone: "America/New_York",
        instructions: "You are a friendly and professional receptionist.",
        knowledge_base: "",
        greeting_message: "Thank you for calling. How can I help you today?",
        voice: "alloy",
      });
      toast({ title: "Business created", description: "Your new business agent is ready to configure." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create business", variant: "destructive" });
    },
  });

  const deleteBusiness = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast({ title: "Business deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Businesses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI agents — each business gets its own phone numbers, knowledge base, and calendar.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  placeholder="Joe's Pizza"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agent Voice</Label>
                <Select value={form.voice} onValueChange={(v) => setForm({ ...form, voice: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VOICES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea
                  placeholder="Thank you for calling..."
                  value={form.greeting_message}
                  onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Agent Instructions</Label>
                <Textarea
                  placeholder="How the agent should behave..."
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Knowledge Base</Label>
                <Textarea
                  placeholder="Menu items, services, pricing, FAQs — anything the agent should know..."
                  value={form.knowledge_base}
                  onChange={(e) => setForm({ ...form, knowledge_base: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createBusiness.mutate()}
                disabled={!form.name || createBusiness.isPending}
              >
                {createBusiness.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Business
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!businesses?.length ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No businesses yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Add your first business to get started. Each business gets its own AI phone agent with a dedicated knowledge base and calendar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz: any) => (
            <Card
              key={biz.id}
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/business/${biz.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{biz.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {biz.industry?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={biz.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {biz.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {biz.phone_numbers?.[0]?.count ?? 0} numbers
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5" />
                      {biz.voice}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBusiness.mutate(biz.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

export default Businesses;
