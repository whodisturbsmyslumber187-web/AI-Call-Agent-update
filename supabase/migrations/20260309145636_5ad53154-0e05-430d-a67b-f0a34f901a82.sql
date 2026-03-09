
-- Platform settings table for global defaults
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  setting_key text NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON public.platform_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages settings" ON public.platform_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API credentials table for editable provider groups
CREATE TABLE public.api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'custom',
  credential_key text NOT NULL DEFAULT '',
  credential_value_encrypted text NOT NULL DEFAULT '',
  is_configured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credentials" ON public.api_credentials FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages credentials" ON public.api_credentials FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Call summaries table
CREATE TABLE public.call_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id uuid NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_topics text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own summaries" ON public.call_summaries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_summaries.business_id AND businesses.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_summaries.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages summaries" ON public.call_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SLA rules table
CREATE TABLE public.sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'max_wait_time',
  threshold_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sla rules" ON public.sla_rules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sla_rules.business_id AND businesses.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sla_rules.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages sla rules" ON public.sla_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SLA alerts table
CREATE TABLE public.sla_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sla_rule_id uuid NOT NULL REFERENCES public.sla_rules(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'warning',
  message text NOT NULL DEFAULT '',
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sla alerts" ON public.sla_alerts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sla_alerts.business_id AND businesses.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sla_alerts.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages sla alerts" ON public.sla_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Revenue entries table
CREATE TABLE public.revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'booking',
  description text NOT NULL DEFAULT '',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own revenue" ON public.revenue_entries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = revenue_entries.business_id AND businesses.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = revenue_entries.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages revenue" ON public.revenue_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add lead scoring columns to customer_profiles
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS lead_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS lead_intent text NOT NULL DEFAULT '';
