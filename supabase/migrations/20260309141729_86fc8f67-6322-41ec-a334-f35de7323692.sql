-- Create agent_config table
CREATE TABLE public.agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL DEFAULT 'Restaurant',
  restaurant_hours TEXT NOT NULL DEFAULT 'Monday-Sunday: 5:00 PM - 10:00 PM',
  menu TEXT NOT NULL DEFAULT 'Menu items',
  instructions TEXT NOT NULL DEFAULT 'You are a friendly restaurant receptionist. Be helpful and professional.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_config_updated_at
  BEFORE UPDATE ON public.agent_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role can manage conversations" ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Service role can manage reservations" ON public.reservations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read agent config" ON public.agent_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agent config" ON public.agent_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage agent config" ON public.agent_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'restaurant',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'active',
  instructions TEXT NOT NULL DEFAULT 'You are a friendly and professional receptionist.',
  knowledge_base TEXT NOT NULL DEFAULT '',
  greeting_message TEXT NOT NULL DEFAULT 'Thank you for calling. How can I help you today?',
  voice TEXT NOT NULL DEFAULT 'alloy',
  llm_provider TEXT NOT NULL DEFAULT 'lovable_ai',
  llm_model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  llm_api_endpoint TEXT,
  llm_api_key_name TEXT,
  tts_provider TEXT NOT NULL DEFAULT 'openai',
  tts_voice_id TEXT,
  tts_api_endpoint TEXT,
  tts_api_key_name TEXT,
  livekit_enabled BOOLEAN NOT NULL DEFAULT false,
  livekit_room_prefix TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_sid TEXT,
  label TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  script TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  call_status TEXT NOT NULL DEFAULT 'pending',
  called_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own businesses" ON public.businesses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all businesses" ON public.businesses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own phone numbers" ON public.phone_numbers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = phone_numbers.business_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = phone_numbers.business_id AND user_id = auth.uid()));
CREATE POLICY "Service role manages phone numbers" ON public.phone_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own availability" ON public.availability_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = availability_slots.business_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = availability_slots.business_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own contacts" ON public.contacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = contacts.business_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = contacts.business_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = campaigns.business_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = campaigns.business_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own campaign contacts" ON public.campaign_contacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c JOIN public.businesses b ON b.id = c.business_id WHERE c.id = campaign_contacts.campaign_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c JOIN public.businesses b ON b.id = c.business_id WHERE c.id = campaign_contacts.campaign_id AND b.user_id = auth.uid()));
CREATE POLICY "Service role manages businesses" ON public.businesses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages availability" ON public.availability_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages contacts" ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages campaigns" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages campaign contacts" ON public.campaign_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

INSERT INTO public.agent_config (restaurant_name, restaurant_hours, menu, instructions)
VALUES (
  'Demo Restaurant',
  'Monday-Sunday: 5:00 PM - 10:00 PM',
  'Starters: Caesar Salad ($12), Soup of the Day ($8). Mains: Grilled Salmon ($28), Ribeye Steak ($38). Desserts: Tiramisu ($10).',
  'You are a friendly receptionist for our restaurant. Help customers make reservations and answer questions about our menu and hours.'
);