-- 1. Knowledge base items table
CREATE TABLE public.knowledge_base_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own KB items" ON public.knowledge_base_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = knowledge_base_items.business_id AND businesses.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = knowledge_base_items.business_id AND businesses.user_id = auth.uid()));

CREATE POLICY "Service role manages KB items" ON public.knowledge_base_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Call logs table
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'inbound',
  caller_number text,
  caller_name text,
  duration_seconds integer,
  transcript text,
  outcome text DEFAULT 'completed',
  recording_url text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own call logs" ON public.call_logs
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_logs.business_id AND businesses.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = call_logs.business_id AND businesses.user_id = auth.uid()));

CREATE POLICY "Service role manages call logs" ON public.call_logs
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for call_logs (for live monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;

-- 3. Storage bucket for knowledge base files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-base', 'knowledge-base', true);

-- Storage RLS: users can manage files for their own businesses
CREATE POLICY "Users can upload KB files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'knowledge-base');

CREATE POLICY "Users can read KB files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'knowledge-base');

CREATE POLICY "Users can delete KB files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'knowledge-base');

-- 4. Google calendar connections table
CREATE TABLE public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  google_calendar_id text,
  sync_enabled boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar connections" ON public.calendar_connections
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = calendar_connections.business_id AND businesses.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = calendar_connections.business_id AND businesses.user_id = auth.uid()));

CREATE POLICY "Service role manages calendar connections" ON public.calendar_connections
FOR ALL TO service_role USING (true) WITH CHECK (true);