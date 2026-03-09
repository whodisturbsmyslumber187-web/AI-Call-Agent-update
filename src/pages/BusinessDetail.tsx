import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import BusinessSettingsTab from "@/components/business/BusinessSettingsTab";
import PhoneNumbersTab from "@/components/business/PhoneNumbersTab";
import CalendarTab from "@/components/business/CalendarTab";
import ContactsTab from "@/components/business/ContactsTab";
import CampaignsTab from "@/components/business/CampaignsTab";
import ProvidersTab from "@/components/business/ProvidersTab";
import LiveKitCallTab from "@/components/business/LiveKitCallTab";
import KnowledgeBaseTab from "@/components/business/KnowledgeBaseTab";
import CallLogsTab from "@/components/business/CallLogsTab";
import GoogleCalendarTab from "@/components/business/GoogleCalendarTab";

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Business not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {business.industry?.replace("_", " ")} • {business.status}
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="flex w-full max-w-5xl overflow-x-auto">
          <TabsTrigger value="settings">Agent</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="phones">Phones</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="gcal">Google Cal</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          {business.livekit_enabled && <TabsTrigger value="livekit">Live Call</TabsTrigger>}
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <BusinessSettingsTab business={business} />
        </TabsContent>
        <TabsContent value="providers" className="mt-6">
          <ProvidersTab business={business} />
        </TabsContent>
        <TabsContent value="phones" className="mt-6">
          <PhoneNumbersTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <CalendarTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="gcal" className="mt-6">
          <GoogleCalendarTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-6">
          <KnowledgeBaseTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="contacts" className="mt-6">
          <ContactsTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-6">
          <CampaignsTab businessId={business.id} />
        </TabsContent>
        <TabsContent value="call-logs" className="mt-6">
          <CallLogsTab businessId={business.id} />
        </TabsContent>
        {business.livekit_enabled && (
          <TabsContent value="livekit" className="mt-6">
            <LiveKitCallTab businessId={business.id} businessName={business.name} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BusinessDetail;
