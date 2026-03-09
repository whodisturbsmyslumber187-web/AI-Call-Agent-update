import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RotateCcw } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_SLOTS: Slot[] = DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: "09:00",
  end_time: "17:00",
  is_available: i >= 1 && i <= 5,
}));

interface Props {
  businessId: string;
}

const CalendarTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS);

  const { isLoading } = useQuery({
    queryKey: ["availability", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week");
      if (error) throw error;
      if (data?.length) {
        const merged = DEFAULT_SLOTS.map((def) => {
          const found = data.find((d: any) => d.day_of_week === def.day_of_week);
          return found ? { ...found, start_time: found.start_time.slice(0, 5), end_time: found.end_time.slice(0, 5) } : def;
        });
        setSlots(merged);
      }
      return data;
    },
  });

  const saveSlots = useMutation({
    mutationFn: async () => {
      // Delete existing and re-insert
      await supabase.from("availability_slots").delete().eq("business_id", businessId);
      const { error } = await supabase.from("availability_slots").insert(
        slots.map((s) => ({
          business_id: businessId,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_available: s.is_available,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", businessId] });
      toast({ title: "Calendar saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    },
  });

  const updateSlot = (dayIndex: number, field: keyof Slot, value: any) => {
    setSlots((prev) =>
      prev.map((s) => (s.day_of_week === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Availability Calendar</h3>
          <p className="text-sm text-muted-foreground">Set when the agent can book appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSlots(DEFAULT_SLOTS)}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />Reset
          </Button>
          <Button size="sm" onClick={() => saveSlots.mutate()} disabled={saveSlots.isPending}>
            {saveSlots.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <Card key={slot.day_of_week} className={`bg-card border-border ${!slot.is_available ? "opacity-50" : ""}`}>
            <CardContent className="flex items-center gap-4 py-3">
              <Switch
                checked={slot.is_available}
                onCheckedChange={(v) => updateSlot(slot.day_of_week, "is_available", v)}
              />
              <span className="w-24 text-sm font-medium text-foreground">{DAYS[slot.day_of_week]}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateSlot(slot.day_of_week, "start_time", e.target.value)}
                  className="w-32"
                  disabled={!slot.is_available}
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateSlot(slot.day_of_week, "end_time", e.target.value)}
                  className="w-32"
                  disabled={!slot.is_available}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CalendarTab;
