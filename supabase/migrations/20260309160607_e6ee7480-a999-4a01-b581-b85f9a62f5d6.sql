
-- IVR Menus table
CREATE TABLE public.ivr_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  template_type text NOT NULL DEFAULT 'custom',
  greeting_text text NOT NULL DEFAULT '',
  greeting_audio_url text,
  timeout_seconds integer NOT NULL DEFAULT 10,
  max_retries integer NOT NULL DEFAULT 2,
  fallback_action text NOT NULL DEFAULT 'agent',
  fallback_target text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ivr_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages ivr_menus" ON public.ivr_menus FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own ivr_menus" ON public.ivr_menus FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ivr_menus.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ivr_menus.business_id AND businesses.user_id = auth.uid()));

-- IVR Options table
CREATE TABLE public.ivr_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ivr_menu_id uuid NOT NULL REFERENCES public.ivr_menus(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  digit text NOT NULL DEFAULT '1',
  label text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT 'ai_agent',
  target_phone text,
  agent_instructions text,
  mask_caller_id boolean NOT NULL DEFAULT false,
  record_call boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ivr_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages ivr_options" ON public.ivr_options FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own ivr_options" ON public.ivr_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ivr_options.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = ivr_options.business_id AND businesses.user_id = auth.uid()));

-- Number assignments table
CREATE TABLE public.number_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id uuid NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  handler_type text NOT NULL DEFAULT 'ai_agent',
  handler_name text,
  forward_to_phone text,
  ivr_menu_id uuid REFERENCES public.ivr_menus(id) ON DELETE SET NULL,
  mask_caller_id boolean NOT NULL DEFAULT false,
  record_calls boolean NOT NULL DEFAULT true,
  monitor_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone_number_id)
);

ALTER TABLE public.number_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages number_assignments" ON public.number_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own number_assignments" ON public.number_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = number_assignments.business_id AND businesses.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = number_assignments.business_id AND businesses.user_id = auth.uid()));

-- Alter phone_numbers
ALTER TABLE public.phone_numbers
  ADD COLUMN IF NOT EXISTS assigned_handler_type text NOT NULL DEFAULT 'ai_agent',
  ADD COLUMN IF NOT EXISTS assigned_handler_name text,
  ADD COLUMN IF NOT EXISTS forward_to_phone text,
  ADD COLUMN IF NOT EXISTS mask_caller_id boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS record_calls boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ivr_menu_id uuid REFERENCES public.ivr_menus(id) ON DELETE SET NULL;

-- Alter businesses for STT/IVR
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stt_provider text NOT NULL DEFAULT 'deepgram',
  ADD COLUMN IF NOT EXISTS stt_model text NOT NULL DEFAULT 'nova-2',
  ADD COLUMN IF NOT EXISTS endpointing_threshold_ms integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS barge_in_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS voicemail_detection_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ivr_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_ivr_menu_id uuid REFERENCES public.ivr_menus(id) ON DELETE SET NULL;
