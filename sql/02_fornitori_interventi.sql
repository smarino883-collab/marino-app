-- =====================================================
-- ESTENSIONE: FORNITORI E INTERVENTI
-- Esegui dopo lo script principale
-- =====================================================

-- FORNITORI
CREATE TABLE IF NOT EXISTS public.fornitori (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT,
  ragione_sociale TEXT,
  email TEXT UNIQUE,
  telefono TEXT,
  specializzazione TEXT, -- idraulico, elettricista, giardiniere, impresa, altro
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  password_hash TEXT, -- in produzione usare auth.users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fornitori_email ON public.fornitori(email);

-- INTERVENTI (guasti / lavori)
CREATE TABLE IF NOT EXISTS public.interventi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  fornitore_id UUID REFERENCES public.fornitori(id) ON DELETE SET NULL,
  segnalazione_id UUID REFERENCES public.segnalazioni(id) ON DELETE SET NULL,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  stato TEXT DEFAULT 'da_aprire' CHECK (stato IN (
    'da_aprire', 'aperto', 'in_corso', 'completato', 'chiuso'
  )),
  note_fornitore TEXT,
  foto_paths TEXT[],
  data_inizio TIMESTAMPTZ,
  data_fine TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventi_fornitore ON public.interventi(fornitore_id);
CREATE INDEX IF NOT EXISTS idx_interventi_stato ON public.interventi(condominio_id, stato);
CREATE INDEX IF NOT EXISTS idx_interventi_condo ON public.interventi(condominio_id);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_fornitori
  BEFORE UPDATE ON public.fornitori
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_interventi
  BEFORE UPDATE ON public.interventi
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventi ENABLE ROW LEVEL SECURITY;

-- Policy fornitori
CREATE POLICY "Admin gestisce fornitori"
  ON public.fornitori FOR ALL
  USING (public.is_admin());

CREATE POLICY "Fornitore vede se stesso"
  ON public.fornitori FOR SELECT
  USING (id::text = auth.uid()::text OR public.is_admin());

-- Policy interventi
CREATE POLICY "Admin gestisce tutti gli interventi"
  ON public.interventi FOR ALL
  USING (public.is_admin());

CREATE POLICY "Fornitore vede e aggiorna i propri interventi"
  ON public.interventi FOR SELECT
  USING (fornitore_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY "Fornitore aggiorna i propri interventi"
  ON public.interventi FOR UPDATE
  USING (fornitore_id::text = auth.uid()::text);

CREATE POLICY "Utenti vedono interventi del proprio condominio"
  ON public.interventi FOR SELECT
  USING (
    condominio_id IN (SELECT public.get_user_condomini())
    OR public.is_admin()
  );
