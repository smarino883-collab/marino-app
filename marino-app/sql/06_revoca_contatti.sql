-- Revoca singolo condomino
ALTER TABLE public.condomini_contatti
  ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS revocato_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS note_revoca TEXT;

CREATE INDEX IF NOT EXISTS idx_contatti_attivo
  ON public.condomini_contatti(condominio_id, attivo);
