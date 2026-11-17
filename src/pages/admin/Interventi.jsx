import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Wrench, Plus, X, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const STATI = {
  da_aprire: { label: 'Da aprire', color: 'bg-slate-100 text-slate-700' },
  aperto: { label: 'Aperto', color: 'bg-blue-100 text-blue-700' },
  in_corso: { label: 'In corso', color: 'bg-amber-100 text-amber-700' },
  completato: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  chiuso: { label: 'Chiuso', color: 'bg-slate-100 text-slate-500' },
}
const INP = 'w-full border border-slate-200 rounded-xl px-3 py-2.5'

export default function AdminInterventi() {
  const [interventi, setInterventi] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [condomini, setCondomini] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titolo: '', descrizione: '', condominio_id: '', fornitore_id: '', file: null })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [i, f, c] = await Promise.all([
      supabase.from('interventi').select('*, condominio:condomini(nome), fornitore:fornitori(nome, ragione_sociale)').order('created_at', { ascending: false }),
      supabase.from('fornitori').select('*').eq('attivo', true),
      supabase.from('condomini').select('id, nome').eq('attivo', true),
    ])
    setInterventi(i.data || [])
    setFornitori(f.data || [])
    setCondomini(c.data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    let file_path = null
    let file_nome = null
    if (form.file) {
      const ext = (form.file.name.split('.').pop() || 'pdf')
      file_path = (form.condominio_id || 'x') + '/' + Date.now() + '.' + ext
      file_nome = form.file.name
      const { error: upErr } = await supabase.storage.from('interventi').upload(file_path, form.file)
      if (upErr) {
        alert('Errore upload: ' + upErr.message)
        setSaving(false)
        return
      }
    }
    const { error } = await supabase.from('interventi').insert({
      titolo: form.titolo,
      descrizione: form.descrizione || null,
      condominio_id: form.condominio_id,
      fornitore_id: form.fornitore_id || null,
      stato: form.fornitore_id ? 'aperto' : 'da_aprire',
      file_path,
      file_nome,
    })
    setSaving(false)
    if (error) { alert('Errore: ' + error.message); return }
    setShowForm(false)
    setForm({ titolo: '', descrizione: '', condominio_id: '', fornitore_id: '', file: null })
    loadAll()
  }

  async function handleDelete(id, titolo, path) {
    if (!confirm('Eliminare intervento "' + (titolo || '') + '"?')) return
    if (path) {
      try { await supabase.storage.from('interventi').remove([path]) } catch (_) {}
    }
    const { error } = await supabase.from('interventi').delete().eq('id', id)
    if (error) alert('Errore: ' + error.message)
    else loadAll()
  }

  async function assegnaFornitore(id, fornitoreId) {
    await supabase.from('interventi').update({ fornitore_id: fornitoreId, stato: 'aperto' }).eq('id', id)
    loadAll()
  }

  async function downloadPdf(i) {
    if (!i.file_path) return
    const { data, error } = await supabase.storage.from('interventi').download(i.file_path)
    if (error) { alert(error.message); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = i.file_nome || 'intervento.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Interventi e Guasti</h1>
        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
          <Plus size={16} /> Nuovo
        </button>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo intervento</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Titolo *" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} className={INP} />
              <textarea rows={3} placeholder="Descrizione" value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} className={INP} />
              <select required value={form.condominio_id} onChange={(e) => setForm({ ...form, condominio_id: e.target.value })} className={INP}>
                <option value="">Condominio *</option>
                {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select value={form.fornitore_id} onChange={(e) => setForm({ ...form, fornitore_id: e.target.value })} className={INP}>
                <option value="">Fornitore (opzionale)</option>
                {fornitori.map((f) => <option key={f.id} value={f.id}>{f.ragione_sociale || f.nome}</option>)}
              </select>
              <div>
                <label className="block text-sm font-medium mb-1">PDF allegato (opzionale)</label>
                <input type="file" accept=".pdf,application/pdf" onChange={(e) => setForm({ ...form, file: e.target.files && e.target.files[0] ? e.target.files[0] : null })} />
                {form.file ? <p className="text-xs text-slate-500 mt-1">{form.file.name}</p> : null}
              </div>
              <button type="submit" disabled={saving} className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium disabled:opacity-60">
                {saving ? 'Salvataggio...' : 'Crea intervento'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : interventi.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <Wrench className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun intervento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interventi.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <h3 className="font-medium">{i.titolo}</h3>
                  <p className="text-sm text-slate-500">{i.condominio && i.condominio.nome}</p>
                </div>
                <span className={'text-xs px-2 py-0.5 rounded-full ' + ((STATI[i.stato] && STATI[i.stato].color) || '')}>
                  {(STATI[i.stato] && STATI[i.stato].label) || i.stato}
                </span>
              </div>
              {i.descrizione ? <p className="text-sm text-slate-600 mt-1">{i.descrizione}</p> : null}
              <p className="text-xs text-slate-400 mt-2">
                {i.fornitore ? 'Fornitore: ' + (i.fornitore.ragione_sociale || i.fornitore.nome) : 'Non assegnato'}
                {i.created_at ? ' · ' + format(new Date(i.created_at), 'd MMM yyyy', { locale: it }) : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {i.file_path ? (
                  <button type="button" onClick={() => downloadPdf(i)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg flex items-center gap-1">
                    <Download size={12} /> PDF
                  </button>
                ) : null}
                {!i.fornitore_id && fornitori.length > 0 ? (
                  <select className="text-xs border rounded-lg px-2 py-1" defaultValue="" onChange={(e) => { if (e.target.value) assegnaFornitore(i.id, e.target.value) }}>
                    <option value="">Assegna fornitore...</option>
                    {fornitori.map((f) => <option key={f.id} value={f.id}>{f.ragione_sociale || f.nome}</option>)}
                  </select>
                ) : null}
                <button type="button" onClick={() => handleDelete(i.id, i.titolo, i.file_path)} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg flex items-center gap-1">
                  <Trash2 size={12} /> Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}