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
import AgentMemoryTab from "@/components/business/AgentMemoryTab";
import RoutingRulesTab from "@/components/business/RoutingRulesTab";
import CustomerProfilesTab from "@/components/business/CustomerProfilesTab";
import VoicemailTab from "@/components/business/VoicemailTab";
import WebhooksTab from "@/components/business/WebhooksTab";
import MessageTemplatesTab from "@/components/business/MessageTemplatesTab";
import CallSummariesTab from "@/components/business/CallSummariesTab";
import SlaRulesTab from "@/components/business/SlaRulesTab";
import RevenueTab from "@/components/business/RevenueTab";
import ExperimentsTab from "@/components/business/ExperimentsTab";
import PersonalitySlidersCard from "@/components/business/PersonalitySlidersCard";
import BulkCallingTab from "@/components/business/BulkCallingTab";
import InboundCapacityTab from "@/components/business/InboundCapacityTab";
import DncListTab from "@/components/business/DncListTab";
import CallDispositionsTab from "@/components/business/CallDispositionsTab";
import ContactSegmentsTab from "@/components/business/ContactSegmentsTab";
import ProviderFailoverTab from "@/components/business/ProviderFailoverTab";
import MarketingCampaignsTab from "@/components/business/MarketingCampaignsTab";

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
            {business.industry?.replace("_", " ")} • {business.status} • {business.agent_mode} mode
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="flex w-full max-w-7xl overflow-x-auto">
          <TabsTrigger value="settings">Agent</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="failover">Failover</TabsTrigger>
          <TabsTrigger value="phones">Phones</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="gcal">Google Cal</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="customers">CRM</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="bulk-calling">Bulk Calls</TabsTrigger>
          <TabsTrigger value="inbound">Inbound Cap</TabsTrigger>
          <TabsTrigger value="dnc">DNC</TabsTrigger>
          <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          <TabsTrigger value="dispositions">Dispositions</TabsTrigger>
          <TabsTrigger value="summaries">Summaries</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
          <TabsTrigger value="templates">Messages</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          {business.livekit_enabled && <TabsTrigger value="livekit">Live Call</TabsTrigger>}
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <BusinessSettingsTab business={business} />
            <PersonalitySlidersCard business={business} />
          </div>
        </TabsContent>
        <TabsContent value="memory" className="mt-6"><AgentMemoryTab businessId={business.id} /></TabsContent>
        <TabsContent value="providers" className="mt-6"><ProvidersTab business={business} /></TabsContent>
        <TabsContent value="failover" className="mt-6"><ProviderFailoverTab businessId={business.id} /></TabsContent>
        <TabsContent value="phones" className="mt-6"><PhoneNumbersTab businessId={business.id} /></TabsContent>
        <TabsContent value="routing" className="mt-6"><RoutingRulesTab businessId={business.id} /></TabsContent>
        <TabsContent value="calendar" className="mt-6"><CalendarTab businessId={business.id} /></TabsContent>
        <TabsContent value="gcal" className="mt-6"><GoogleCalendarTab businessId={business.id} /></TabsContent>
        <TabsContent value="knowledge" className="mt-6"><KnowledgeBaseTab businessId={business.id} /></TabsContent>
        <TabsContent value="contacts" className="mt-6"><ContactsTab businessId={business.id} /></TabsContent>
        <TabsContent value="segments" className="mt-6"><ContactSegmentsTab businessId={business.id} /></TabsContent>
        <TabsContent value="customers" className="mt-6"><CustomerProfilesTab businessId={business.id} /></TabsContent>
        <TabsContent value="campaigns" className="mt-6"><CampaignsTab businessId={business.id} /></TabsContent>
        <TabsContent value="bulk-calling" className="mt-6"><BulkCallingTab businessId={business.id} /></TabsContent>
        <TabsContent value="inbound" className="mt-6"><InboundCapacityTab businessId={business.id} /></TabsContent>
        <TabsContent value="dnc" className="mt-6"><DncListTab businessId={business.id} /></TabsContent>
        <TabsContent value="call-logs" className="mt-6"><CallLogsTab businessId={business.id} /></TabsContent>
        <TabsContent value="dispositions" className="mt-6"><CallDispositionsTab businessId={business.id} /></TabsContent>
        <TabsContent value="summaries" className="mt-6"><CallSummariesTab businessId={business.id} /></TabsContent>
        <TabsContent value="sla" className="mt-6"><SlaRulesTab businessId={business.id} /></TabsContent>
        <TabsContent value="revenue" className="mt-6"><RevenueTab businessId={business.id} /></TabsContent>
        <TabsContent value="voicemail" className="mt-6"><VoicemailTab businessId={business.id} /></TabsContent>
        <TabsContent value="templates" className="mt-6"><MessageTemplatesTab businessId={business.id} /></TabsContent>
        <TabsContent value="webhooks" className="mt-6"><WebhooksTab businessId={business.id} /></TabsContent>
        <TabsContent value="experiments" className="mt-6"><ExperimentsTab businessId={business.id} /></TabsContent>
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
