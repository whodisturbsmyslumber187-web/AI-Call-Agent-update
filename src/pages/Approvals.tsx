import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Check, X } from "lucide-react";
import { useEffect } from "react";

const Approvals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["approval-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*, business:businesses(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("approval_requests").update({ status, approved_by: user?.id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast({ title: "Updated" });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("approvals")
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    approved: "bg-green-500/10 text-green-500",
    denied: "bg-red-500/10 text-red-500",
  };

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Approval Queue
        </h1>
        <p className="text-sm text-muted-foreground">{pendingCount} pending approvals</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !requests?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">No approval requests.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} className={`bg-card border-border ${req.status === "pending" ? "border-primary/30" : ""}`}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{req.request_type}</Badge>
                    <Badge variant="outline" className={statusColors[req.status] || ""}>{req.status}</Badge>
                    <span className="text-sm text-muted-foreground">{(req as any).business?.name}</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {typeof req.details === "object" ? JSON.stringify(req.details) : String(req.details)}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleString()}</p>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-500" onClick={() => updateRequest.mutate({ id: req.id, status: "approved" })}>
                      <Check className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateRequest.mutate({ id: req.id, status: "denied" })}>
                      <X className="mr-1 h-3 w-3" /> Deny
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;
