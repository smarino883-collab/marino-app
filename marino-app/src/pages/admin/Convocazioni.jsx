import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ClipboardList, Plus, X, Download, Users } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { notifyCondominiConvocazione } from '../../lib/notifications'

export default function AdminConvocazioni() {
  const [lista, setLista] = useState([])
  const [condomini, setCondomini] = useState([])
  const [firmeCount, setFirmeCount] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [firmeDetail, setFirmeDetail] = useState([])
  const [form, setForm] = useState({
    titolo: '', data_assemblea: '', luogo: '', note: '', condominio_id: '', file: null,
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [c, co] = await Promise.all([
      supabase.from('convocazioni').select('*, condominio:condomini(nome)').order('created_at', { ascending: false }),
      supabase.from('condomini').select('id, nome').eq('attivo', true),
    ])
    setLista(c.data || [])
    setCondomini(co.data || [])

    if (c.data?.length) {
      const { data: firme } = await supabase
        .from('convocazioni_firme')
        .select('convocazione_id')
        .in('convocazione_id', c.data.map((x) => x.id))
      const counts = {}
      ;(firme || []).forEach((f) => {
        counts[f.convocazione_id] = (counts[f.convocazione_id] || 0) + 1
      })
      setFirmeCount(counts)
    }
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setUploading(true)
    let file_path = null

    if (form.file) {
      const ext = form.file.name.split('.').pop()
      file_path = `${form.condominio_id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('convocazioni').upload(file_path, form.file)
      if (upErr) {
        alert('Errore upload: ' + upErr.message)
        setUploading(false)
        return
      }
    }

    const { data: created, error } = await supabase.from('convocazioni').insert({
      titolo: form.titolo,
      data_assemblea: form.data_assemblea || null,
      luogo: form.luogo,
      note: form.note,
      condominio_id: form.condominio_id,
      file_path,
    }).select('id').single()

    setUploading(false)
    if (!error) {
      try {
        const condo = condomini.find((c) => c.id === form.condominio_id)
        let dataLabel = ''
        if (form.data_assemblea) {
          try {
            dataLabel = format(new Date(form.data_assemblea), "d MMM yyyy HH:mm", { locale: it })
          } catch (_) {
            dataLabel = form.data_assemblea
          }
        }
        await notifyCondominiConvocazione({
          emails: [],
          titolo: form.titolo,
          dataAssemblea: dataLabel,
          condominioNome: condo?.nome,
          condominio_id: form.condominio_id,
          convocazione_id: created?.id,
        })
      } catch (_) {}
      setShowForm(false)
      setForm({ titolo: '', data_assemblea: '', luogo: '', note: '', condominio_id: '', file: null })
      load()
    } else {
      alert('Errore: ' + error.message)
    }
  }

  async function mostraFirme(id) {
    setDetailId(id)
    const { data } = await supabase
      .from('convocazioni_firme')
      .select('*')
      .eq('convocazione_id', id)
      .order('firmato_at')
    setFirmeDetail(data || [])
  }

  async function download(conv) {
    if (!conv.file_path) return
    const { data, error } = await supabase.storage.from('convocazioni').download(conv.file_path)
    if (error) { alert('Errore'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = conv.titolo + '.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Convocazioni</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700">
          <Plus size={16} /> Nuova
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuova convocazione</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condominio *</label>
                <select required value={form.condominio_id} onChange={(e) => setForm({ ...form, condominio_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Seleziona...</option>
                  {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titolo *</label>
                <input required value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Es. Assemblea ordinaria 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Data assemblea</label>
                  <input type="datetime-local" value={form.data_assemblea} onChange={(e) => setForm({ ...form, data_assemblea: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Luogo</label>
                  <input value={form.luogo} onChange={(e) => setForm({ ...form, luogo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File PDF convocazione</label>
                <input type="file" accept=".pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} className="w-full text-sm" />
              </div>
              <button type="submit" disabled={uploading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60">
                {uploading ? 'Salvataggio...' : 'Pubblica convocazione'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dettaglio firme */}
      {detailId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Firme ricevute</h2>
              <button onClick={() => setDetailId(null)}><X size={20} /></button>
            </div>
            {firmeDetail.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nessuna firma ancora</p>
            ) : (
              <div className="space-y-2">
                {firmeDetail.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-sm">{f.nome_firmatario}</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(f.firmato_at), 'd MMM HH:mm', { locale: it })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <ClipboardList className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessuna convocazione</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-800">{c.titolo}</h3>
                  <p className="text-sm text-slate-500">{c.condominio?.nome}</p>
                  {c.data_assemblea && (
                    <p className="text-sm text-slate-500">
                      {format(new Date(c.data_assemblea), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {c.file_path && (
                  <button onClick={() => download(c)}
                    className="flex items-center gap-1 text-xs bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200">
                    <Download size={12} /> PDF
                  </button>
                )}
                <button onClick={() => mostraFirme(c.id)}
                  className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100">
                  <Users size={12} /> {firmeCount[c.id] || 0} firme
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
