import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Plus, X, Phone, Mail, Trash2, Copy } from 'lucide-react'

const SPECS = ['Idraulico', 'Elettricista', 'Giardiniere', 'Impresa edile', 'Falegname', 'Fabbro', 'Pulizie', 'Ascensorista', 'Altro']
const INP = 'w-full border border-slate-200 rounded-xl px-3 py-2.5'

function generaCodice() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function AdminFornitori() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', ragione_sociale: '', email: '', telefono: '', specializzazione: 'Altro', note: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('fornitori').select('*').order('ragione_sociale')
    if (error) alert('Errore: ' + error.message)
    setLista(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const codice_accesso = generaCodice()
    const { error } = await supabase.from('fornitori').insert({
      nome: form.nome || null,
      ragione_sociale: form.ragione_sociale,
      email: form.email || null,
      telefono: form.telefono || null,
      specializzazione: form.specializzazione,
      note: form.note || null,
      codice_accesso,
      attivo: true,
    })
    if (error) { alert('Errore creazione: ' + error.message); return }
    alert('Creato. Codice: ' + codice_accesso)
    setShowForm(false)
    setForm({ nome: '', ragione_sociale: '', email: '', telefono: '', specializzazione: 'Altro', note: '' })
    load()
  }

  async function toggleAttivo(id, attuale) {
    const { error } = await supabase.from('fornitori').update({ attivo: !attuale }).eq('id', id)
    if (error) alert(error.message)
    else load()
  }

  async function handleDelete(id, nome) {
    if (!confirm('Eliminare "' + (nome || '') + '"?')) return
    await supabase.from('interventi').update({ fornitore_id: null }).eq('fornitore_id', id)
    const { error } = await supabase.from('fornitori').delete().eq('id', id)
    if (error) alert('Errore eliminazione: ' + error.message)
    else load()
  }

  async function nuovoCodice(id) {
    const codice = generaCodice()
    const { error } = await supabase.from('fornitori').update({ codice_accesso: codice }).eq('id', id)
    if (error) alert(error.message)
    else { alert('Nuovo codice: ' + codice); load() }
  }

  function copia(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Fornitori</h1>
        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
          <Plus size={16} /> Nuovo
        </button>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo fornitore</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Ragione sociale *" value={form.ragione_sociale} onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })} className={INP} />
              <input placeholder="Referente" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={INP} />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={INP} />
              <input placeholder="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={INP} />
              <select value={form.specializzazione} onChange={(e) => setForm({ ...form, specializzazione: e.target.value })} className={INP}>
                {SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea rows={2} placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={INP} />
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium">Salva</button>
            </form>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : (
        <div className="space-y-3">
          {lista.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border p-4">
              <div className="font-medium flex items-center gap-2">
                <Users size={16} className="text-teal-600" />
                {f.ragione_sociale || f.nome}
              </div>
              <p className="text-xs text-slate-500">{f.specializzazione}</p>
              {f.email ? <p className="text-xs flex items-center gap-1 mt-1"><Mail size={12} />{f.email}</p> : null}
              {f.telefono ? <p className="text-xs flex items-center gap-1"><Phone size={12} />{f.telefono}</p> : null}
              {f.codice_accesso ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">{f.codice_accesso}</span>
                  <button type="button" onClick={() => copia(f.codice_accesso)} className="text-teal-700 text-xs"><Copy size={12} /></button>
                </div>
              ) : (
                <p className="text-xs text-amber-600 mt-1">Nessun codice</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => toggleAttivo(f.id, f.attivo)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg">{f.attivo ? 'Disattiva' : 'Attiva'}</button>
                <button type="button" onClick={() => nuovoCodice(f.id)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg">Nuovo codice</button>
                <button type="button" onClick={() => handleDelete(f.id, f.ragione_sociale || f.nome)} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg flex items-center gap-1"><Trash2 size={12} /> Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}