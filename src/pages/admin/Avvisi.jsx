import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Bell, Plus, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function AdminAvvisi() {
  const [lista, setLista] = useState([])
  const [condomini, setCondomini] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titolo: '',
    contenuto: '',
    condominio_id: '',
    importante: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [nRes, cRes] = await Promise.all([
      supabase
        .from('notizie')
        .select('*, condomini(nome)')
        .order('published_at', { ascending: false }),
      supabase.from('condomini').select('id, nome').eq('attivo', true).order('nome'),
    ])
    setLista(nRes.data || [])
    setCondomini(cRes.data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('notizie').insert({
      titolo: form.titolo.trim(),
      contenuto: form.contenuto.trim() || null,
      condominio_id: form.condominio_id,
      importante: form.importante,
      published_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      alert('Errore: ' + error.message)
      return
    }
    setShowForm(false)
    setForm({ titolo: '', contenuto: '', condominio_id: '', importante: false })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo avviso?')) return
    await supabase.from('notizie').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell size={22} /> Bacheca avvisi
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Nuovo avviso
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Gli avvisi compaiono nella Home dei condomini del condominio scelto.
      </p>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo avviso</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condominio *</label>
                <select
                  required
                  value={form.condominio_id}
                  onChange={(e) => setForm({ ...form, condominio_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleziona...</option>
                  {condomini.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titolo *</label>
                <input
                  required
                  value={form.titolo}
                  onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Es. Interruzione acqua martedì"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Testo</label>
                <textarea
                  value={form.contenuto}
                  onChange={(e) => setForm({ ...form, contenuto: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Dettagli per i condomini..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.importante}
                  onChange={(e) => setForm({ ...form, importante: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600"
                />
                Segna come importante
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? 'Pubblicazione...' : 'Pubblica in bacheca'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-sm">
          Nessun avviso. Pubblicane uno per i condomini.
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((n) => (
            <div
              key={n.id}
              className={
                'bg-white rounded-xl p-4 border shadow-sm ' +
                (n.importante ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100')
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-800">{n.titolo}</h3>
                    {n.importante && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Importante
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {n.condomini?.nome || 'Condominio'}
                    {n.published_at
                      ? ' · ' +
                        format(new Date(n.published_at), "d MMM yyyy HH:mm", { locale: it })
                      : ''}
                  </p>
                  {n.contenuto && (
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{n.contenuto}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="p-2 text-slate-400 hover:text-red-600 shrink-0"
                  title="Elimina"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}