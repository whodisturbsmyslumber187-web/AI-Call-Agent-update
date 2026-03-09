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
import { Calendar, CalendarCheck, CalendarDays, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isThisWeek } from "date-fns";

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  date: string;
  time: string;
  guests: number;
  status: string;
  created_at: string;
  business_id: string | null;
}

const Reservations = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
    const fetchReservations = async () => {
      let query = supabase
        .from("reservations")
        .select("*")
        .order("date", { ascending: true });

      if (selectedBusiness !== "all") {
        query = query.eq("business_id", selectedBusiness);
      }

      const { data, error } = await query;
      if (!error && data) setReservations(data);
      setLoading(false);
    };

    fetchReservations();

    const channel = supabase
      .channel("reservations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchReservations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedBusiness]);

  const totalReservations = reservations.length;
  const todayReservations = reservations.filter((r) => isToday(new Date(r.date))).length;
  const weekReservations = reservations.filter((r) => isThisWeek(new Date(r.date))).length;

  const getBusinessName = (businessId: string | null) => {
    if (!businessId || !businesses) return "Unassigned";
    return businesses.find((b) => b.id === businessId)?.name ?? "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground mt-2">Manage restaurant reservations</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalReservations}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayReservations}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{weekReservations}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Business</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Guests</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No reservations yet</TableCell>
                </TableRow>
              ) : (
                reservations.map((res) => (
                  <TableRow key={res.id} className="border-border">
                    <TableCell className="text-foreground font-medium">{res.name}</TableCell>
                    <TableCell className="text-muted-foreground">{getBusinessName(res.business_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{res.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(res.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{res.time}</TableCell>
                    <TableCell className="text-muted-foreground">{res.guests}</TableCell>
                    <TableCell>
                      <Badge
                        variant={res.status === "confirmed" ? "default" : "destructive"}
                        className={res.status === "confirmed" ? "bg-primary text-primary-foreground" : ""}
                      >
                        {res.status}
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

export default Reservations;
