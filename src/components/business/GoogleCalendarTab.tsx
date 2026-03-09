import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, RefreshCw, Link2 } from "lucide-react";
import { useState } from "react";

interface Props {
  businessId: string;
}

const GoogleCalendarTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calendarId, setCalendarId] = useState("");

  const { data: connection, isLoading } = useQuery({
    queryKey: ["calendar-connection", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertConnection = useMutation({
    mutationFn: async ({ googleCalendarId, syncEnabled }: { googleCalendarId?: string; syncEnabled?: boolean }) => {
      const payload: any = {
        business_id: businessId,
        google_calendar_id: googleCalendarId ?? connection?.google_calendar_id ?? calendarId,
        sync_enabled: syncEnabled ?? connection?.sync_enabled ?? false,
      };

      if (connection) {
        const { error } = await supabase
          .from("calendar_connections")
          .update(payload)
          .eq("id", connection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendar_connections")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connection", businessId] });
      toast({ title: "Calendar settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Connect a Google Calendar for real-time availability instead of manual slots.
            When enabled, the agent will check the calendar before booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Calendar ID</Label>
            <Input
              value={connection?.google_calendar_id || calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              placeholder="your-calendar@gmail.com"
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Calendar → Settings → Calendar ID
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sync Enabled</Label>
              <p className="text-xs text-muted-foreground">Pull availability from Google Calendar</p>
            </div>
            <Switch
              checked={connection?.sync_enabled || false}
              onCheckedChange={(checked) => upsertConnection.mutate({ syncEnabled: checked })}
            />
          </div>

          {connection?.last_synced_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Last synced: {new Date(connection.last_synced_at).toLocaleString()}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={connection?.sync_enabled ? "default" : "secondary"}>
              {connection?.sync_enabled ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          <Button
            onClick={() => upsertConnection.mutate({ googleCalendarId: calendarId })}
            disabled={upsertConnection.isPending}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {connection ? "Update Connection" : "Connect Calendar"}
          </Button>

          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            <strong>Note:</strong> Full Google Calendar OAuth integration requires setting up Google API credentials.
            For now, this stores the calendar reference. A future update will add real-time sync via Google Calendar API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarTab;
