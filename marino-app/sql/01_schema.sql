-- MARINO AMMINISTRAZIONI - Schema principale (01)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.condomini (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  indirizzo TEXT,
  citta TEXT,
  cap TEXT,
  codice_fiscale TEXT,
  codice_accesso TEXT NOT NULL UNIQUE,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_condomini_codice ON public.condomini(codice_accesso);

CREATE TABLE public.utenti_admin (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  cognome TEXT,
  email TEXT,
  telefono TEXT,
  ruolo TEXT DEFAULT 'admin' CHECK (ruolo IN ('admin', 'collaboratore')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.condomini_utenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  unita TEXT,
  millesimi NUMERIC(10,4),
  ruolo TEXT DEFAULT 'proprietario' CHECK (ruolo IN ('proprietario', 'inquilino', 'delegato')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, condominio_id)
);

CREATE TABLE public.notizie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  contenuto TEXT,
  importante BOOLEAN DEFAULT false,
  pubblicato_da UUID REFERENCES public.utenti_admin(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.eventi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  tipo TEXT DEFAULT 'altro' CHECK (tipo IN ('assemblea', 'scadenza_rata', 'manutenzione', 'altro')),
  data_inizio TIMESTAMPTZ NOT NULL,
  data_fine TIMESTAMPTZ,
  tutto_il_giorno BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.documenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  categoria TEXT DEFAULT 'altro' CHECK (categoria IN (
    'regolamento', 'bilancio', 'verbale', 'tabella', 'avviso', 'altro'
  )),
  file_path TEXT NOT NULL,
  file_nome TEXT,
  file_size INTEGER,
  caricato_da UUID REFERENCES auth.users(id),
  is_pubblico BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.convocazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  data_assemblea TIMESTAMPTZ,
  luogo TEXT,
  file_path TEXT,
  note TEXT,
  creato_da UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.convocazioni_firme (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convocazione_id UUID NOT NULL REFERENCES public.convocazioni(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  nome_firmatario TEXT NOT NULL,
  unita TEXT,
  firmato_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  tipo_firma TEXT DEFAULT 'presa_visione' CHECK (tipo_firma IN ('presa_visione', 'accettazione')),
  UNIQUE(convocazione_id, user_id)
);

CREATE TABLE public.segnalazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  foto_paths TEXT[],
  urgenza TEXT DEFAULT 'media' CHECK (urgenza IN ('bassa', 'media', 'alta')),
  stato TEXT DEFAULT 'ricevuta' CHECK (stato IN ('ricevuta', 'in_lavorazione', 'risolta', 'chiusa')),
  risposta_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comunicazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
  mittente_id TEXT NOT NULL,
  destinatario_id TEXT,
  oggetto TEXT,
  messaggio TEXT NOT NULL,
  letto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_condomini
  BEFORE UPDATE ON public.condomini
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_segnalazioni
  BEFORE UPDATE ON public.segnalazioni
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_user_condomini()
RETURNS SETOF UUID AS $$
  SELECT condominio_id FROM public.condomini_utenti WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.utenti_admin WHERE id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utenti_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notizie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocazioni_firme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segnalazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicazioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "condomini_select" ON public.condomini FOR SELECT USING (true);
CREATE POLICY "condomini_write" ON public.condomini FOR ALL USING (true);
CREATE POLICY "admin_select" ON public.utenti_admin FOR SELECT USING (true);
CREATE POLICY "admin_write" ON public.utenti_admin FOR ALL USING (true);
CREATE POLICY "cu_select" ON public.condomini_utenti FOR SELECT USING (true);
CREATE POLICY "cu_write" ON public.condomini_utenti FOR ALL USING (true);
CREATE POLICY "notizie_select" ON public.notizie FOR SELECT USING (true);
CREATE POLICY "notizie_write" ON public.notizie FOR ALL USING (true);
CREATE POLICY "eventi_select" ON public.eventi FOR SELECT USING (true);
CREATE POLICY "eventi_write" ON public.eventi FOR ALL USING (true);
CREATE POLICY "documenti_select" ON public.documenti FOR SELECT USING (true);
CREATE POLICY "documenti_write" ON public.documenti FOR ALL USING (true);
CREATE POLICY "convocazioni_select" ON public.convocazioni FOR SELECT USING (true);
CREATE POLICY "convocazioni_write" ON public.convocazioni FOR ALL USING (true);
CREATE POLICY "firme_select" ON public.convocazioni_firme FOR SELECT USING (true);
CREATE POLICY "firme_write" ON public.convocazioni_firme FOR ALL USING (true);
CREATE POLICY "segnalazioni_all" ON public.segnalazioni FOR ALL USING (true);
CREATE POLICY "comunicazioni_all" ON public.comunicazioni FOR ALL USING (true);
