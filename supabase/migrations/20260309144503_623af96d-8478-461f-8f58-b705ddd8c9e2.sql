
-- =============================================
-- ROUND 1-4: ALL DATABASE CHANGES
-- =============================================

-- 1. Alter businesses table for agent personas & multi-language
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS agent_mode text NOT NULL DEFAULT 'receptionist',
  ADD COLUMN IF NOT EXISTS sales_script text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS objection_handling text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS upsell_prompts text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS closing_techniques text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supported_languages text[] NOT NULL DEFAULT ARRAY['en']::text[],
  ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'en';

-- 2. Agent Learnings table
CREATE TABLE public.agent_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'faq',
  trigger_phrase text NOT NULL DEFAULT '',
  learned_response text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  confidence numeric NOT NULL DEFAULT 0.5,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_learnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own learnings" ON public.agent_learnings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = agent_learnings.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = agent_learnings.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages learnings" ON public.agent_learnings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Agent Chat Messages table
CREATE TABLE public.agent_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  to_business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'tip',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own agent chats" ON public.agent_chat_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = agent_chat_messages.from_business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = agent_chat_messages.from_business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Users can read broadcast messages" ON public.agent_chat_messages FOR SELECT TO authenticated
  USING (agent_chat_messages.to_business_id IS NULL OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = agent_chat_messages.to_business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages agent chats" ON public.agent_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Industry Templates table
CREATE TABLE public.industry_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  name text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  greeting text NOT NULL DEFAULT '',
  knowledge_base_template text NOT NULL DEFAULT '',
  sales_script text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Building2',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.industry_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages templates" ON public.industry_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Call Routing Rules table
CREATE TABLE public.call_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  condition_type text NOT NULL DEFAULT 'time',
  condition_value text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT 'agent',
  target text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routing rules" ON public.call_routing_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_routing_rules.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_routing_rules.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages routing rules" ON public.call_routing_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Call Queue table
CREATE TABLE public.call_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  caller_number text,
  caller_name text,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting',
  estimated_wait integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own queue" ON public.call_queue FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_queue.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_queue.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages queue" ON public.call_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Customer Profiles table
CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone text,
  email text,
  name text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  sentiment_score numeric DEFAULT 0,
  total_calls integer NOT NULL DEFAULT 0,
  total_spend numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  last_contact_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own customer profiles" ON public.customer_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customer_profiles.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customer_profiles.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages customer profiles" ON public.customer_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Call Scores table
CREATE TABLE public.call_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id uuid NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  sentiment text NOT NULL DEFAULT 'neutral',
  customer_satisfaction integer NOT NULL DEFAULT 3,
  agent_performance integer NOT NULL DEFAULT 3,
  key_moments text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own call scores" ON public.call_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM call_logs cl JOIN businesses b ON b.id = cl.business_id WHERE cl.id = call_scores.call_log_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM call_logs cl JOIN businesses b ON b.id = cl.business_id WHERE cl.id = call_scores.call_log_id AND b.user_id = auth.uid()));
CREATE POLICY "Service role manages call scores" ON public.call_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. Approval Requests table
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'escalation',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  requested_by text NOT NULL DEFAULT 'agent',
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own approvals" ON public.approval_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = approval_requests.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = approval_requests.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages approvals" ON public.approval_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 10. Dashboard Layouts table
CREATE TABLE public.dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own layouts" ON public.dashboard_layouts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages layouts" ON public.dashboard_layouts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. Message Templates table
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'sms',
  trigger_event text NOT NULL DEFAULT 'post_call',
  template_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own message templates" ON public.message_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = message_templates.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = message_templates.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages message templates" ON public.message_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 12. Voicemails table
CREATE TABLE public.voicemails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  caller_number text,
  caller_name text,
  transcription text NOT NULL DEFAULT '',
  audio_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.voicemails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own voicemails" ON public.voicemails FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = voicemails.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = voicemails.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages voicemails" ON public.voicemails FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 13. Webhooks table
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'call_ended',
  target_url text NOT NULL DEFAULT '',
  secret text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  last_status_code integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own webhooks" ON public.webhooks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = webhooks.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = webhooks.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages webhooks" ON public.webhooks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;
