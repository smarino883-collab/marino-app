-- =====================================================
-- Push notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  user_id UUID,
  ruolo TEXT, -- condomino | fornitore | admin
  condominio_id UUID REFERENCES public.condomini(id) ON DELETE CASCADE,
  fornitore_id UUID REFERENCES public.fornitori(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_condo ON public.push_subscriptions(condominio_id);
CREATE INDEX IF NOT EXISTS idx_push_fornitore ON public.push_subscriptions(fornitore_id);
CREATE INDEX IF NOT EXISTS idx_push_ruolo ON public.push_subscriptions(ruolo);

CREATE TABLE IF NOT EXISTS public.push_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT DEFAULT '/',
  user_id UUID,
  ruolo TEXT,
  condominio_id UUID,
  fornitore_id UUID,
  stato TEXT DEFAULT 'pending' CHECK (stato IN ('pending', 'sent', 'error')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_queue_stato ON public.push_queue(stato, created_at);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiunque autenticato può salvare la propria subscription"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update subscription per endpoint"
  ON public.push_subscriptions FOR UPDATE
  USING (true);

CREATE POLICY "Delete own subscription"
  ON public.push_subscriptions FOR DELETE
  USING (true);

CREATE POLICY "Admin legge subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Insert in push queue"
  ON public.push_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin gestisce push queue"
  ON public.push_queue FOR ALL
  USING (public.is_admin());
