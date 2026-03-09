import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, Loader2 } from "lucide-react";

interface Props {
  business: any;
}

const sliders = [
  { key: "personality_friendliness", label: "Friendliness", low: "Reserved", high: "Very Warm" },
  { key: "personality_formality", label: "Formality", low: "Casual", high: "Very Formal" },
  { key: "personality_urgency", label: "Urgency", low: "Relaxed", high: "High Urgency" },
  { key: "personality_humor", label: "Humor", low: "Serious", high: "Playful" },
];

const PersonalitySlidersCard = ({ business }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    personality_friendliness: business.personality_friendliness ?? 5,
    personality_formality: business.personality_formality ?? 5,
    personality_urgency: business.personality_urgency ?? 5,
    personality_humor: business.personality_humor ?? 3,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("businesses").update(values).eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", business.id] });
      toast({ title: "Personality Saved" });
    },
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Agent Personality
        </CardTitle>
        <CardDescription>Fine-tune how the AI agent communicates. These modify the system prompt.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sliders.map((s) => (
          <div key={s.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{s.label}</Label>
              <span className="text-xs text-muted-foreground font-mono">{(values as any)[s.key]}/10</span>
            </div>
            <Slider
              value={[(values as any)[s.key]]}
              onValueChange={([v]) => setValues({ ...values, [s.key]: v })}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{s.low}</span>
              <span>{s.high}</span>
            </div>
          </div>
        ))}
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full" size="sm">
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Personality
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalitySlidersCard;
