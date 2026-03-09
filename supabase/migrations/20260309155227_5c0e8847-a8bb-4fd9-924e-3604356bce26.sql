
-- Table: bulk_marketing_jobs
CREATE TABLE public.bulk_marketing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  job_type text NOT NULL DEFAULT 'rvm',
  status text NOT NULL DEFAULT 'queued',
  total_contacts integer NOT NULL DEFAULT 0,
  completed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  in_progress integer NOT NULL DEFAULT 0,
  message_content text NOT NULL DEFAULT '',
  audio_url text,
  caller_id text NOT NULL DEFAULT '',
  ring_count integer NOT NULL DEFAULT 1,
  callback_number text NOT NULL DEFAULT '',
  concurrency_limit integer NOT NULL DEFAULT 5,
  rate_per_minute integer NOT NULL DEFAULT 10,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_marketing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages bulk_marketing_jobs" ON public.bulk_marketing_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own bulk_marketing_jobs" ON public.bulk_marketing_jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_marketing_jobs.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_marketing_jobs.business_id AND businesses.user_id = auth.uid()));

-- Table: bulk_marketing_entries
CREATE TABLE public.bulk_marketing_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.bulk_marketing_jobs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  delivery_result text,
  callback_at timestamptz,
  sms_sid text,
  attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_marketing_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages bulk_marketing_entries" ON public.bulk_marketing_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own bulk_marketing_entries" ON public.bulk_marketing_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_marketing_entries.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bulk_marketing_entries.business_id AND businesses.user_id = auth.uid()));

-- Table: sms_templates
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'marketing',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sms_templates" ON public.sms_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own sms_templates" ON public.sms_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sms_templates.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = sms_templates.business_id AND businesses.user_id = auth.uid()));
