import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FileText, Download, Upload, X, FolderOpen } from 'lucide-react'
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

export default function Documenti() {
  const { condominio, user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ titolo: '', categoria: 'altro', file: null })
  const [filtro, setFiltro] = useState('tutti')

  useEffect(() => {
    if (condominio) load()
  }, [condominio])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('documenti')
      .select('*')
      .eq('condominio_id', condominio.id)
      .eq('is_pubblico', true)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file) return
    setUploading(true)

    const ext = form.file.name.split('.').pop()
    const path = `${condominio.id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('documenti')
      .upload(path, form.file)

    if (upErr) {
      alert('Errore upload: ' + upErr.message)
      setUploading(false)
      return
    }

    await supabase.from('documenti').insert({
      condominio_id: condominio.id,
      titolo: form.titolo || form.file.name,
      categoria: form.categoria,
      file_path: path,
      file_nome: form.file.name,
      file_size: form.file.size,
      caricato_da: user.id,
      is_pubblico: false, // i documenti dei condomini non sono pubblici di default
    })

    setUploading(false)
    setShowUpload(false)
    setForm({ titolo: '', categoria: 'altro', file: null })
    load()
  }

  async function download(doc) {
    const { data, error } = await supabase.storage
      .from('documenti')
      .download(doc.file_path)
    if (error) {
      alert('Errore download')
      return
    }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.file_nome || doc.titolo
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtrati = filtro === 'tutti' ? docs : docs.filter((d) => d.categoria === filtro)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Documenti</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Upload size={16} /> Carica
        </button>
      </div>

      {/* Filtri categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltro('tutti')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filtro === 'tutti' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border'}`}
        >
          Tutti
        </button>
        {Object.entries(CATEGORIE).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFiltro(k)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filtro === k ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Carica documento</h2>
              <button onClick={() => setShowUpload(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titolo</label>
                <input
                  value={form.titolo}
                  onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nome del documento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(CATEGORIE).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File (PDF, immagini...)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                  className="w-full text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {uploading ? 'Caricamento...' : 'Carica documento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : filtrati.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <FolderOpen className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun documento disponibile</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrati.map((d) => (
            <div key={d.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 truncate">{d.titolo}</h3>
                <p className="text-xs text-slate-400">
                  {CATEGORIE[d.categoria] || d.categoria}
                  {d.created_at && ` · ${format(new Date(d.created_at), 'd MMM yyyy', { locale: it })}`}
                </p>
              </div>
              <button
                onClick={() => download(d)}
                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                title="Scarica"
              >
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
