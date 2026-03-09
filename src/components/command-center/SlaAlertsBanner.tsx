import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

const SlaAlertsBanner = () => {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["sla-alerts-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_alerts")
        .select("*, businesses(name)")
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sla_alerts").update({ acknowledged: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sla-alerts-global"] }),
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a: any) => (
        <div key={a.id} className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground">
              <strong>{a.businesses?.name || "Unknown"}</strong>: {a.message}
            </span>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => dismiss.mutate(a.id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SlaAlertsBanner;
