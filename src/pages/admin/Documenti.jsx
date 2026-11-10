import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, Plus, X, Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const CATEGORIE = {
  regolamento: 'Regolamento',
  bilancio: 'Bilancio',
  verbale: 'Verbale',
  tabella: 'Tabelle millesimali',
  avviso: 'Avviso',
  altro: 'Altro',
}

export default function AdminDocumenti() {
  const [docs, setDocs] = useState([])
  const [condomini, setCondomini] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    titolo: '', categoria: 'altro', condominio_id: '', file: null, is_pubblico: true,
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [d, c] = await Promise.all([
      supabase.from('documenti').select('*, condominio:condomini(nome)').order('created_at', { ascending: false }),
      supabase.from('condomini').select('id, nome').eq('attivo', true),
    ])
    setDocs(d.data || [])
    setCondomini(c.data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file || !form.condominio_id) return
    setUploading(true)

    const ext = form.file.name.split('.').pop()
    const path = `${form.condominio_id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from('documenti').upload(path, form.file)
    if (upErr) {
      alert('Errore upload: ' + upErr.message)
      setUploading(false)
      return
    }

    await supabase.from('documenti').insert({
      condominio_id: form.condominio_id,
      titolo: form.titolo || form.file.name,
      categoria: form.categoria,
      file_path: path,
      file_nome: form.file.name,
      file_size: form.file.size,
      is_pubblico: form.is_pubblico,
    })

    setUploading(false)
    setShowForm(false)
    setForm({ titolo: '', categoria: 'altro', condominio_id: '', file: null, is_pubblico: true })
    load()
  }

  async function download(doc) {
    const { data, error } = await supabase.storage.from('documenti').download(doc.file_path)
    if (error) { alert('Errore download'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.file_nome || doc.titolo
    a.click()
    URL.revokeObjectURL(url)
  }

  async function elimina(id, path) {
    if (!confirm('Eliminare questo documento?')) return
    await supabase.storage.from('documenti').remove([path])
    await supabase.from('documenti').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Documenti</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700">
          <Plus size={16} /> Carica
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Carica documento</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condominio *</label>
                <select required value={form.condominio_id} onChange={(e) => setForm({ ...form, condominio_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Seleziona...</option>
                  {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titolo</label>
                <input value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  {Object.entries(CATEGORIE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File *</label>
                <input type="file" required onChange={(e) => setForm({ ...form, file: e.target.files[0] })} className="w-full text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_pubblico} onChange={(e) => setForm({ ...form, is_pubblico: e.target.checked })} />
                Visibile ai condomini
              </label>
              <button type="submit" disabled={uploading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60">
                {uploading ? 'Caricamento...' : 'Carica'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <FileText className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun documento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 truncate">{d.titolo}</h3>
                <p className="text-xs text-slate-400">
                  {d.condominio?.nome} · {CATEGORIE[d.categoria]}
                  {d.created_at && ` · ${format(new Date(d.created_at), 'd MMM yyyy', { locale: it })}`}
                </p>
              </div>
              <button onClick={() => download(d)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg">
                <Download size={18} />
              </button>
              <button onClick={() => elimina(d.id, d.file_path)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
