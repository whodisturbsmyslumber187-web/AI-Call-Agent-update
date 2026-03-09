
-- New tables for bulk calling engine
CREATE TABLE public.bulk_call_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  job_type text NOT NULL DEFAULT 'outbound',
  total_contacts integer NOT NULL DEFAULT 0,
  completed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  in_progress integer NOT NULL DEFAULT 0,
  concurrency_limit integer NOT NULL DEFAULT 5,
  calls_per_minute integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bulk_call_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.bulk_call_jobs(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_attempt_at timestamptz,
  duration_seconds integer,
  outcome text,
  transcript_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbound_capacity_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_concurrent_calls integer NOT NULL DEFAULT 10,
  overflow_action text NOT NULL DEFAULT 'queue',
  overflow_target text NOT NULL DEFAULT '',
  auto_scale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.telegram_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bot_token_secret_name text NOT NULL DEFAULT '',
  chat_id text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  notifications jsonb NOT NULL DEFAULT '{"call_completed": true, "daily_summary": true, "sla_alert": true, "booking_created": true, "bulk_job_completed": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.telegram_commands_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  command text NOT NULL DEFAULT '',
  response_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.call_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id uuid REFERENCES public.call_logs(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  transfer_type text NOT NULL DEFAULT 'warm',
  transfer_to text NOT NULL DEFAULT '',
  context_summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dnc_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  reason text NOT NULL DEFAULT '',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, phone_number)
);

CREATE TABLE public.call_dispositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id uuid REFERENCES public.call_logs(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  disposition text NOT NULL DEFAULT 'completed',
  notes text NOT NULL DEFAULT '',
  next_action text,
  next_action_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  filter_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.provider_failover_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  primary_provider text NOT NULL DEFAULT 'lovable_ai',
  backup_provider text NOT NULL DEFAULT 'openai',
  max_failures_before_switch integer NOT NULL DEFAULT 3,
  current_failure_count integer NOT NULL DEFAULT 0,
  is_failed_over boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_hash text NOT NULL DEFAULT '',
  key_prefix text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '{"read": true, "write": false}'::jsonb,
  rate_limit integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Alter campaigns table
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS concurrency_limit integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS calls_per_minute integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS retry_delay_minutes integer NOT NULL DEFAULT 30;

-- Enable RLS on all new tables
ALTER TABLE public.bulk_call_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_call_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_capacity_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_commands_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dnc_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_dispositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_failover_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk_call_jobs
CREATE POLICY "Users can manage own bulk_call_jobs" ON public.bulk_call_jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_call_jobs.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_call_jobs.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages bulk_call_jobs" ON public.bulk_call_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for bulk_call_entries
CREATE POLICY "Users can manage own bulk_call_entries" ON public.bulk_call_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_call_entries.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_call_entries.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages bulk_call_entries" ON public.bulk_call_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for inbound_capacity_config
CREATE POLICY "Users can manage own inbound_capacity" ON public.inbound_capacity_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = inbound_capacity_config.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = inbound_capacity_config.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages inbound_capacity" ON public.inbound_capacity_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for telegram_config
CREATE POLICY "Users can manage own telegram_config" ON public.telegram_config FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages telegram_config" ON public.telegram_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for telegram_commands_log
CREATE POLICY "Users can manage own telegram_commands_log" ON public.telegram_commands_log FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages telegram_commands_log" ON public.telegram_commands_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for call_transfers
CREATE POLICY "Users can manage own call_transfers" ON public.call_transfers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_transfers.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_transfers.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages call_transfers" ON public.call_transfers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for dnc_list
CREATE POLICY "Users can manage own dnc_list" ON public.dnc_list FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = dnc_list.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = dnc_list.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages dnc_list" ON public.dnc_list FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for call_dispositions
CREATE POLICY "Users can manage own call_dispositions" ON public.call_dispositions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_dispositions.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_dispositions.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages call_dispositions" ON public.call_dispositions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for contact_segments
CREATE POLICY "Users can manage own contact_segments" ON public.contact_segments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = contact_segments.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = contact_segments.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages contact_segments" ON public.contact_segments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for provider_failover_config
CREATE POLICY "Users can manage own provider_failover" ON public.provider_failover_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = provider_failover_config.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = provider_failover_config.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages provider_failover" ON public.provider_failover_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS policies for api_keys
CREATE POLICY "Users can manage own api_keys" ON public.api_keys FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages api_keys" ON public.api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for bulk jobs progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_call_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_call_entries;
