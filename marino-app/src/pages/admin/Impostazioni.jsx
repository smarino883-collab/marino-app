import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Settings, Mail, Save, Bell, Smartphone } from 'lucide-react'

export default function AdminImpostazioni() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_notify_email')
      .maybeSingle()
    setEmail(data?.value || '')
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'admin_notify_email',
        value: email.trim(),
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
    if (error) {
      setMsg('Errore: ' + error.message)
    } else {
      setMsg('Email di notifica salvata')
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Settings size={22} /> Impostazioni
      </h1>

      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-medium">
          <Mail size={18} className="text-teal-600" />
          Email notifiche amministratore
        </div>
        <p className="text-sm text-slate-500">
          Riceverai una email quando arriva una nuova segnalazione dai condomini.
          L’invio effettivo richiede la Edge Function e un provider email (es. Resend) attivi.
        </p>

        {loading ? (
          <div className="text-sm text-slate-400">Caricamento...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. info@marinoamministrazioni.it"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full bg-teal-600 text-white py-2.5 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Salvataggio...' : 'Salva email'}
            </button>
            {msg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith('Errore') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {msg}
              </div>
            )}
          </form>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 font-medium text-amber-900">
          <Smartphone size={18} />
          Notifiche sul cellulare
        </div>
        <p className="text-sm text-amber-900/80">
          <strong>Al momento no:</strong> l’app non invia notifiche push sul telefono
          (il banner che appare anche a schermo bloccato).
        </p>
        <p className="text-sm text-amber-900/80">
          Cosa c’è oggi:
        </p>
        <ul className="text-sm text-amber-900/80 list-disc pl-5 space-y-1">
          <li>Novità visibili <strong>dentro l’app</strong> quando l’utente la apre</li>
          <li>Email in coda (admin e fornitori), se provider e function sono configurati</li>
        </ul>
        <p className="text-sm text-amber-900/80">
          Le push sul cellulare richiedono un servizio aggiuntivo (Firebase Cloud Messaging o OneSignal)
          e il consenso dell’utente sul dispositivo. Si possono aggiungere in una fase successiva.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 font-medium text-slate-800 mb-2">
          <Bell size={18} className="text-teal-600" />
          Riepilogo canali
        </div>
        <table className="w-full text-sm">
          <tbody className="text-slate-600">
            <tr className="border-b border-slate-50">
              <td className="py-2">In app</td>
              <td className="py-2 text-right text-green-700 font-medium">Attivo</td>
            </tr>
            <tr className="border-b border-slate-50">
              <td className="py-2">Email</td>
              <td className="py-2 text-right text-amber-700 font-medium">Coda pronta*</td>
            </tr>
            <tr>
              <td className="py-2">Push cellulare</td>
              <td className="py-2 text-right text-green-700 font-medium">Pronto*</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">
          * L’email parte solo dopo aver collegato Resend (o simile) e la Edge Function.
        </p>
      </div>
    </div>
  )
}
