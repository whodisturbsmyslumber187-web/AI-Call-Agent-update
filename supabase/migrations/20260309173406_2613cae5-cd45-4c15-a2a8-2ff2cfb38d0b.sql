
-- Drop remaining service_role policies that were missed
DROP POLICY IF EXISTS "Service role manages templates" ON public.industry_templates;
DROP POLICY IF EXISTS "Service role manages KB items" ON public.knowledge_base_items;
DROP POLICY IF EXISTS "Service role manages message templates" ON public.message_templates;
DROP POLICY IF EXISTS "Service role can manage messages" ON public.messages;
DROP POLICY IF EXISTS "Service role manages phone numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Service role manages settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Service role can manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Service role manages revenue" ON public.revenue_entries;
DROP POLICY IF EXISTS "Service role manages sla alerts" ON public.sla_alerts;
DROP POLICY IF EXISTS "Service role manages sla rules" ON public.sla_rules;
DROP POLICY IF EXISTS "Service role manages sms_templates" ON public.sms_templates;
DROP POLICY IF EXISTS "Service role manages telegram_commands_log" ON public.telegram_commands_log;

-- Fix reservations INSERT policy that uses WITH CHECK (true)
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
CREATE POLICY "Authenticated users can create reservations" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (
    (business_id IS NULL) OR (business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    ))
  );
