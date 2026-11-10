# Marino Amministrazioni – App condominio

App web per amministratore, condomini e fornitori.

## Avvio rapido

```bash
cd marino-app
npm install
cp .env.example .env
# modifica .env con URL e anon key di Supabase
npm run dev
```

Apri http://localhost:5173

## Supabase

1. Crea un progetto su https://supabase.com
2. In SQL Editor esegui in ordine gli script in `sql/`:
   - schema principale (tabelle base)
   - `02_fornitori_interventi.sql`
   - `03_privacy_email.sql`
   - `04_push.sql`
   - `05_condomini_contatti.sql`
   - `06_revoca_contatti.sql`
3. Crea i bucket Storage: `documenti`, `convocazioni`, `segnalazioni`
4. Crea un utente in Authentication e una riga in `utenti_admin` con lo stesso UUID

## Variabili ambiente (.env)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_VAPID_PUBLIC_KEY=  (opzionale, per push)
```

## Build produzione

```bash
npm run build
npm run preview
```

Oppure pubblica la cartella `dist/` su Vercel / Netlify.
