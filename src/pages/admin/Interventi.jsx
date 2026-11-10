import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Wrench, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { notifyFornitoreInterventoAssegnato } from '../../lib/notifications'

const STATI = {
  da_aprire: { label: 'Da aprire', color: 'bg-slate-100 text-slate-700' },
  aperto: { label: 'Aperto', color: 'bg-blue-100 text-blue-700' },
  in_corso: { label: 'In corso', color: 'bg-amber-100 text-amber-700' },
  completato: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  chiuso: { label: 'Chiuso', color: 'bg-slate-100 text-slate-500' },
}

export default function AdminInterventi() {
  const [interventi, setInterventi] = useState([])
  const [fornitori, setFornitori] = useState([])
  const [condomini, setCondomini] = useState([])
  const [segnalazioni, setSegnalazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titolo: '',
    descrizione: '',
    condominio_id: '',
    fornitore_id: '',
    segnalazione_id: '',
    stato: 'da_aprire',
  })

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [i, f, c, s] = await Promise.all([
      supabase.from('interventi').select(`
        *,
        condominio:condomini(nome),
        fornitore:fornitori(nome, ragione_sociale, email),
        segnalazione:segnalazioni(titolo)
      `).order('created_at', { ascending: false }),
      supabase.from('fornitori').select('*').eq('attivo', true),
      supabase.from('condomini').select('id, nome').eq('attivo', true),
      supabase.from('segnalazioni').select('id, titolo, condominio_id').in('stato', ['ricevuta', 'in_lavorazione']),
    ])
    setInterventi(i.data || [])
    setFornitori(f.data || [])
    setCondomini(c.data || [])
    setSegnalazioni(s.data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const { data: created, error } = await supabase.from('interventi').insert({
      titolo: form.titolo,
      descrizione: form.descrizione,
      condominio_id: form.condominio_id,
      fornitore_id: form.fornitore_id || null,
      segnalazione_id: form.segnalazione_id || null,
      stato: form.fornitore_id ? 'aperto' : 'da_aprire',
    }).select('id').single()
    if (!error) {
      if (form.fornitore_id) {
        try {
          const fornitore = fornitori.find((f) => f.id === form.fornitore_id)
          const condo = condomini.find((c) => c.id === form.condominio_id)
          if (fornitore?.email) {
            await notifyFornitoreInterventoAssegnato({
              fornitoreEmail: fornitore.email,
              titolo: form.titolo,
              condominioNome: condo?.nome,
              intervento_id: created?.id,
              condominio_id: form.condominio_id,
              fornitore_id: form.fornitore_id,
            })
          }
        } catch (_) {}
      }
      setShowForm(false)
      setForm({ titolo: '', descrizione: '', condominio_id: '', fornitore_id: '', segnalazione_id: '', stato: 'da_aprire' })
      loadAll()
    } else {
      alert('Errore: ' + error.message)
    }
  }

  async function assegnaFornitore(interventoId, fornitoreId) {
    await supabase
      .from('interventi')
      .update({ fornitore_id: fornitoreId, stato: 'aperto' })
      .eq('id', interventoId)
    try {
      const intervento = interventi.find((x) => x.id === interventoId)
      const fornitore = fornitori.find((f) => f.id === fornitoreId)
      if (fornitore?.email && intervento) {
        await notifyFornitoreInterventoAssegnato({
          fornitoreEmail: fornitore.email,
          titolo: intervento.titolo,
          condominioNome: intervento.condominio?.nome,
          intervento_id: interventoId,
          condominio_id: intervento.condominio_id,
          fornitore_id: fornitoreId,
        })
      }
    } catch (_) {}
    loadAll()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Interventi e Guasti</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Nuovo intervento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo intervento</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titolo *</label>
                <input required value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrizione</label>
                <textarea rows={3} value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condominio *</label>
                <select required value={form.condominio_id} onChange={(e) => setForm({ ...form, condominio_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Seleziona...</option>
                  {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fornitore (opzionale)</label>
                <select value={form.fornitore_id} onChange={(e) => setForm({ ...form, fornitore_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Non assegnato</option>
                  {fornitori.map((f) => <option key={f.id} value={f.id}>{f.ragione_sociale || f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collega a segnalazione</label>
                <select value={form.segnalazione_id} onChange={(e) => setForm({ ...form, segnalazione_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Nessuna</option>
                  {segnalazioni.map((s) => <option key={s.id} value={s.id}>{s.titolo}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700">
                Crea intervento
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : interventi.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <Wrench className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun intervento presente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interventi.map((i) => (
            <div key={i.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-800">{i.titolo}</h3>
                  <p className="text-sm text-slate-500">{i.condominio?.nome}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATI[i.stato]?.color}`}>
                  {STATI[i.stato]?.label}
                </span>
              </div>
              {i.descrizione && <p className="text-sm text-slate-600 mt-1">{i.descrizione}</p>}
              {(i.note_fornitore || (i.foto_paths && i.foto_paths.length > 0)) && (
                <p className="text-xs text-teal-600 mt-2">
                  {i.foto_paths?.length ? i.foto_paths.length + ' foto' : ''}
                  {i.foto_paths?.length && i.note_fornitore ? ' · ' : ''}
                  {i.note_fornitore ? 'Ha note del fornitore' : ''}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-slate-400">
                  {i.fornitore
                    ? `Fornitore: ${i.fornitore.ragione_sociale || i.fornitore.nome}`
                    : 'Non assegnato'}
                  {' · '}
                  {format(new Date(i.created_at), 'd MMM yyyy', { locale: it })}
                </div>
                {!i.fornitore_id && fornitori.length > 0 && (
                  <select
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                    defaultValue=""
                    onChange={(e) => e.target.value && assegnaFornitore(i.id, e.target.value)}
                  >
                    <option value="">Assegna fornitore...</option>
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>{f.ragione_sociale || f.nome}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
