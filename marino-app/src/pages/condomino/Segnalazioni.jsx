import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, AlertTriangle, Camera, X } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { notifyAdminNuovaSegnalazione } from '../../lib/notifications'

const STATI = {
  ricevuta: { label: 'Ricevuta', color: 'bg-slate-100 text-slate-700' },
  in_lavorazione: { label: 'In lavorazione', color: 'bg-blue-100 text-blue-700' },
  risolta: { label: 'Risolta', color: 'bg-green-100 text-green-700' },
  chiusa: { label: 'Chiusa', color: 'bg-slate-100 text-slate-500' },
}

const URGENZE = {
  bassa: 'Bassa',
  media: 'Media',
  alta: 'Alta',
}

export default function Segnalazioni() {
  const { condominio, user } = useAuth()
  const [lista, setLista] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titolo: '', descrizione: '', urgenza: 'media' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (condominio) load()
  }, [condominio])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('segnalazioni')
      .select('*')
      .eq('condominio_id', condominio.id)
      .order('created_at', { ascending: false })
    setLista(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { data: inserted, error } = await supabase.from('segnalazioni').insert({
      condominio_id: condominio.id,
      user_id: user.id,
      titolo: form.titolo,
      descrizione: form.descrizione,
      urgenza: form.urgenza,
      stato: 'ricevuta',
    }).select('id').single()
    setSaving(false)
    if (!error) {
      // email admin (se configurata in app_settings)
      try {
        const { data: settings } = await supabase.from('app_settings').select('value').eq('key', 'admin_notify_email').maybeSingle()
        if (settings?.value) {
          await notifyAdminNuovaSegnalazione({
            condominioNome: condominio.nome,
            titolo: form.titolo,
            adminEmail: settings.value,
            condominio_id: condominio.id,
            segnalazione_id: inserted?.id,
          })
        }
      } catch (_) {}
      setShowForm(false)
      setForm({ titolo: '', descrizione: '', urgenza: 'media' })
      load()
    } else {
      alert('Errore nel salvataggio')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Segnalazioni</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Nuova
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuova segnalazione</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titolo</label>
                <input
                  required
                  value={form.titolo}
                  onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Es. Perdita d'acqua in cantina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrizione</label>
                <textarea
                  required
                  rows={4}
                  value={form.descrizione}
                  onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  placeholder="Descrivi il problema in dettaglio..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Urgenza</label>
                <select
                  value={form.urgenza}
                  onChange={(e) => setForm({ ...form, urgenza: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? 'Invio...' : 'Invia segnalazione'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <AlertTriangle className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessuna segnalazione presente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((s) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-800">{s.titolo}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATI[s.stato]?.color}`}>
                  {STATI[s.stato]?.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{s.descrizione}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>Urgenza: {URGENZE[s.urgenza]}</span>
                <span>·</span>
                <span>{format(new Date(s.created_at), 'd MMM yyyy', { locale: it })}</span>
              </div>
              {s.risposta_admin && (
                <div className="mt-3 bg-teal-50 text-teal-800 text-sm p-3 rounded-lg">
                  <strong>Risposta:</strong> {s.risposta_admin}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
