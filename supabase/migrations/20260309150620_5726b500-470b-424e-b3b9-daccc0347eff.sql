
-- New tables for advanced features

-- A/B Testing for agent scripts
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  variant_a_instructions text NOT NULL DEFAULT '',
  variant_b_instructions text NOT NULL DEFAULT '',
  traffic_split integer NOT NULL DEFAULT 50,
  winner text,
  status text NOT NULL DEFAULT 'draft',
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ab_tests" ON public.ab_tests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ab_tests.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ab_tests.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages ab_tests" ON public.ab_tests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Competitor mentions extracted from calls
CREATE TABLE public.competitor_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  competitor_name text NOT NULL DEFAULT '',
  call_log_id uuid REFERENCES public.call_logs(id) ON DELETE SET NULL,
  context text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.competitor_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own competitor_mentions" ON public.competitor_mentions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = competitor_mentions.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = competitor_mentions.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Service role manages competitor_mentions" ON public.competitor_mentions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Scheduled reports
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'daily_summary',
  frequency text NOT NULL DEFAULT 'weekly',
  recipients text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scheduled_reports" ON public.scheduled_reports FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages scheduled_reports" ON public.scheduled_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT '',
  entity_type text NOT NULL DEFAULT '',
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own activity_log" ON public.activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM businesses WHERE businesses.id = activity_log.business_id AND businesses.user_id = auth.uid()));
CREATE POLICY "Users can insert activity_log" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages activity_log" ON public.activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add personality + audio fields to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS hold_music_url text,
  ADD COLUMN IF NOT EXISTS greeting_audio_url text,
  ADD COLUMN IF NOT EXISTS personality_friendliness integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS personality_formality integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS personality_urgency integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS personality_humor integer NOT NULL DEFAULT 3;

-- Recordings storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for recordings
CREATE POLICY "Anyone can read recordings" ON storage.objects FOR SELECT USING (bucket_id = 'recordings');
CREATE POLICY "Authenticated users can upload recordings" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recordings');
CREATE POLICY "Authenticated users can delete recordings" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recordings');
