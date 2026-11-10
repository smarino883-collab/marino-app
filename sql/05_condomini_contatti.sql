-- Contatti facoltativi dei condomini (email dopo login con codice)
CREATE TABLE IF NOT EXISTS public.condomini_contatti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  session_key TEXT, -- es. guest_uuid o codice sessione
  nome TEXT,
  email TEXT,
  unita TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contatti_condo ON public.condomini_contatti(condominio_id);
CREATE INDEX IF NOT EXISTS idx_contatti_email ON public.condomini_contatti(email);

ALTER TABLE public.condomini_contatti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert contatti"
  ON public.condomini_contatti FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update contatti"
  ON public.condomini_contatti FOR UPDATE
  USING (true);

CREATE POLICY "Select contatti proprio o admin"
  ON public.condomini_contatti FOR SELECT
  USING (true);

CREATE POLICY "Admin gestisce contatti"
  ON public.condomini_contatti FOR ALL
  USING (public.is_admin());
