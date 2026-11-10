import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Plus, X, Phone, Mail } from 'lucide-react'

const SPECIALIZZAZIONI = [
  'Idraulico', 'Elettricista', 'Giardiniere', 'Impresa edile',
  'Falegname', 'Fabbro', 'Pulizie', 'Ascensorista', 'Altro'
]

export default function AdminFornitori() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nome: '', ragione_sociale: '', email: '', telefono: '', specializzazione: 'Altro', note: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('fornitori').select('*').order('ragione_sociale')
    setLista(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const { error } = await supabase.from('fornitori').insert({ ...form, attivo: true })
    if (!error) {
      setShowForm(false)
      setForm({ nome: '', ragione_sociale: '', email: '', telefono: '', specializzazione: 'Altro', note: '' })
      load()
    } else {
      alert('Errore: ' + error.message)
    }
  }

  async function toggleAttivo(id, attuale) {
    await supabase.from('fornitori').update({ attivo: !attuale }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Fornitori</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Nuovo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo fornitore</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ragione sociale / Nome *</label>
                <input required value={form.ragione_sociale} onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Referente</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Specializzazione</label>
                <select value={form.specializzazione} onChange={(e) => setForm({ ...form, specializzazione: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  {SPECIALIZZAZIONI.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700">
                Salva fornitore
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <Users className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun fornitore. Aggiungine uno per assegnare gli interventi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((f) => (
            <div key={f.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-800">{f.ragione_sociale || f.nome}</h3>
                  {f.nome && f.ragione_sociale && <p className="text-sm text-slate-500">{f.nome}</p>}
                  <p className="text-xs text-teal-600 mt-0.5">{f.specializzazione}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.attivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {f.attivo ? 'Attivo' : 'Disattivo'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                {f.telefono && (
                  <span className="flex items-center gap-1"><Phone size={12} /> {f.telefono}</span>
                )}
                {f.email && (
                  <span className="flex items-center gap-1"><Mail size={12} /> {f.email}</span>
                )}
              </div>
              <div className="mt-3">
                <button onClick={() => toggleAttivo(f.id, f.attivo)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                  {f.attivo ? 'Disattiva' : 'Attiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
