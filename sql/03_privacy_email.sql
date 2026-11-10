-- =====================================================
-- Privacy consent + coda email notifiche
-- =====================================================

-- Consensi privacy (per utente / codice sessione)
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- auth.users se disponibile
  session_key TEXT, -- per accesso con codice condominio
  ruolo TEXT, -- condomino | fornitore | admin
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  privacy_version TEXT DEFAULT '2026-11',
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_privacy_user ON public.privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_session ON public.privacy_consents(session_key);

-- Preferenze notifiche email
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  email TEXT,
  ruolo TEXT,
  email_convocazioni BOOLEAN DEFAULT true,
  email_segnalazioni BOOLEAN DEFAULT true,
  email_interventi BOOLEAN DEFAULT true,
  email_documenti BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coda invio email (processata da Edge Function)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  tipo TEXT,
  riferimento_id UUID,
  condominio_id UUID REFERENCES public.condomini(id) ON DELETE SET NULL,
  stato TEXT DEFAULT 'pending' CHECK (stato IN ('pending', 'sent', 'error')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_stato ON public.email_queue(stato, created_at);

-- Email di notifica dell'amministratore (globale)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value)
VALUES ('admin_notify_email', '')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti inseriscono il proprio consenso"
  ON public.privacy_consents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin legge consensi"
  ON public.privacy_consents FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin gestisce email queue"
  ON public.email_queue FOR ALL
  USING (public.is_admin());

CREATE POLICY "Sistema può inserire in coda"
  ON public.email_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin gestisce settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin());

CREATE POLICY "Lettura settings limitata"
  ON public.app_settings FOR SELECT
  USING (public.is_admin());
