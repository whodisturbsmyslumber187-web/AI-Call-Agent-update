import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, Clock, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Conversation {
  id: string;
  customer_name: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  business_id: string | null;
}

const Conversations = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const fetchConversations = async () => {
      let query = supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedBusiness !== "all") {
        query = query.eq("business_id", selectedBusiness);
      }

      const { data, error } = await query;
      if (!error && data) setConversations(data);
      setLoading(false);
    };

    fetchConversations();

    const channel = supabase
      .channel("conversations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedBusiness]);

  const totalCalls = conversations.length;
  const activeCalls = conversations.filter((c) => c.status === "active").length;
  const avgDuration = conversations.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / (totalCalls || 1);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBusinessName = (businessId: string | null) => {
    if (!businessId || !businesses) return "Unassigned";
    return businesses.find((b) => b.id === businessId)?.name ?? "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conversations</h1>
          <p className="text-muted-foreground mt-2">View all customer conversations</p>
        </div>
        <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
          <SelectTrigger className="w-[220px] bg-secondary border-border">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Businesses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {businesses?.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCalls}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCalls}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatDuration(Math.round(avgDuration))}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Business</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No conversations yet</TableCell>
                </TableRow>
              ) : (
                conversations.map((conv) => (
                  <TableRow key={conv.id} className="border-border">
                    <TableCell className="text-foreground">{conv.customer_name || "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">{getBusinessName(conv.business_id)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(conv.started_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDuration(conv.duration_seconds)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={conv.status === "active" ? "default" : "secondary"}
                        className={conv.status === "active" ? "bg-primary text-primary-foreground" : ""}
                      >
                        {conv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversations;
