import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Wrench, Clock, CheckCircle, Play, X, MessageSquare, Camera, Image, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const STATI = {
  da_aprire: { label: 'Da aprire', color: 'bg-slate-100 text-slate-700', icon: Clock },
  aperto: { label: 'Aperto', color: 'bg-blue-100 text-blue-700', icon: Wrench },
  in_corso: { label: 'In corso', color: 'bg-amber-100 text-amber-700', icon: Play },
  completato: { label: 'Completato', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  chiuso: { label: 'Chiuso', color: 'bg-slate-100 text-slate-500', icon: CheckCircle },
}

export default function InterventiFornitore() {
  const { profile } = useAuth()
  const [interventi, setInterventi] = useState([])
  const [filtro, setFiltro] = useState('tutti')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [detail, setDetail] = useState(null)
  const [nota, setNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoUrls, setFotoUrls] = useState({})
  const fileRef = useRef(null)

  useEffect(() => {
    if (profile?.id) load()
  }, [profile])

  useEffect(() => {
    if (detail?.foto_paths?.length) {
      loadFotoUrls(detail.foto_paths)
    } else {
      setFotoUrls({})
    }
  }, [detail?.id, detail?.foto_paths])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('interventi')
      .select(`
        *,
        condominio:condomini(nome, indirizzo, citta),
        segnalazione:segnalazioni(titolo, descrizione, urgenza)
      `)
      .eq('fornitore_id', profile.id)
      .order('created_at', { ascending: false })
    setInterventi(data || [])
    setLoading(false)
  }

  async function loadFotoUrls(paths) {
    const urls = {}
    for (const path of paths) {
      const { data } = await supabase.storage.from('segnalazioni').createSignedUrl(path, 3600)
      if (data?.signedUrl) urls[path] = data.signedUrl
    }
    setFotoUrls(urls)
  }

  async function cambiaStato(id, nuovoStato) {
    setUpdating(id)
    const updates = { stato: nuovoStato, updated_at: new Date().toISOString() }
    if (nuovoStato === 'in_corso') updates.data_inizio = new Date().toISOString()
    if (nuovoStato === 'completato') updates.data_fine = new Date().toISOString()
    await supabase.from('interventi').update(updates).eq('id', id)
    await load()
    setUpdating(null)
    if (detail?.id === id) {
      setDetail((d) => ({ ...d, ...updates, stato: nuovoStato }))
    }
  }

  async function salvaNota() {
    if (!detail || !nota.trim()) return
    setSavingNota(true)
    const nuovaNota = detail.note_fornitore
      ? detail.note_fornitore + '\n\n[' + format(new Date(), 'd/MM/yyyy HH:mm') + '] ' + nota.trim()
      : '[' + format(new Date(), 'd/MM/yyyy HH:mm') + '] ' + nota.trim()

    await supabase
      .from('interventi')
      .update({ note_fornitore: nuovaNota, updated_at: new Date().toISOString() })
      .eq('id', detail.id)

    setNota('')
    setSavingNota(false)
    await load()
    setDetail((d) => ({ ...d, note_fornitore: nuovaNota }))
  }

  async function caricaFoto(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !detail) return
    setUploadingFoto(true)

    const nuovePath = [...(detail.foto_paths || [])]

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `interventi/${detail.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('segnalazioni').upload(path, file)
      if (!error) {
        nuovePath.push(path)
      }
    }

    await supabase
      .from('interventi')
      .update({ foto_paths: nuovePath, updated_at: new Date().toISOString() })
      .eq('id', detail.id)

    setUploadingFoto(false)
    if (fileRef.current) fileRef.current.value = ''
    await load()
    setDetail((d) => ({ ...d, foto_paths: nuovePath }))
  }

  async function eliminaFoto(path) {
    if (!detail || !confirm('Eliminare questa foto?')) return
    const nuovePath = (detail.foto_paths || []).filter((p) => p !== path)
    await supabase.storage.from('segnalazioni').remove([path])
    await supabase
      .from('interventi')
      .update({ foto_paths: nuovePath, updated_at: new Date().toISOString() })
      .eq('id', detail.id)
    await load()
    setDetail((d) => ({ ...d, foto_paths: nuovePath }))
  }

  const filtrati = filtro === 'tutti' ? interventi : interventi.filter((i) => i.stato === filtro)

  const conteggi = {
    da_aprire: interventi.filter((i) => i.stato === 'da_aprire').length,
    aperto: interventi.filter((i) => i.stato === 'aperto').length,
    in_corso: interventi.filter((i) => i.stato === 'in_corso').length,
    completato: interventi.filter((i) => i.stato === 'completato').length,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">I miei interventi</h1>
        <p className="text-sm text-slate-500">Gestisci i lavori assegnati</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'da_aprire', label: 'Da aprire' },
          { key: 'aperto', label: 'Aperti' },
          { key: 'in_corso', label: 'In corso' },
          { key: 'completato', label: 'Completati' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFiltro(filtro === s.key ? 'tutti' : s.key)}
            className={'p-3 rounded-xl text-left transition ' + (filtro === s.key ? 'ring-2 ring-teal-500 bg-teal-50' : 'bg-white border border-slate-100')}
          >
            <div className="text-2xl font-bold text-slate-800">{conteggi[s.key]}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : filtrati.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <Wrench className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun intervento {filtro !== 'tutti' ? 'in questo stato' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrati.map((i) => {
            const statoInfo = STATI[i.stato] || STATI.da_aprire
            const Icon = statoInfo.icon
            const nFoto = i.foto_paths?.length || 0
            return (
              <div
                key={i.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:border-teal-200 transition"
                onClick={() => setDetail(i)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      {i.titolo || i.segnalazione?.titolo || 'Intervento'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {i.condominio?.nome}
                      {i.condominio?.indirizzo ? ' – ' + i.condominio.indirizzo : ''}
                    </p>
                  </div>
                  <span className={'flex items-center gap-1 text-xs px-2 py-1 rounded-full shrink-0 ' + statoInfo.color}>
                    <Icon size={12} />
                    {statoInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>Assegnato il {format(new Date(i.created_at), 'd MMM yyyy', { locale: it })}</span>
                  {nFoto > 0 && (
                    <span className="flex items-center gap-1">
                      <Image size={12} /> {nFoto} foto
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Dettaglio intervento</h2>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-800 text-lg">
                  {detail.titolo || detail.segnalazione?.titolo}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {detail.condominio?.nome}
                  {detail.condominio?.indirizzo && ' – ' + detail.condominio.indirizzo}
                  {detail.condominio?.citta && ', ' + detail.condominio.citta}
                </p>
              </div>

              {(detail.descrizione || detail.segnalazione?.descrizione) && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
                  {detail.descrizione || detail.segnalazione?.descrizione}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className={'text-xs px-2 py-1 rounded-full ' + (STATI[detail.stato]?.color || '')}>
                  {STATI[detail.stato]?.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {detail.stato === 'da_aprire' && (
                  <button
                    disabled={updating === detail.id}
                    onClick={() => cambiaStato(detail.id, 'aperto')}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Prendi in carico
                  </button>
                )}
                {detail.stato === 'aperto' && (
                  <button
                    disabled={updating === detail.id}
                    onClick={() => cambiaStato(detail.id, 'in_corso')}
                    className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    Inizia intervento
                  </button>
                )}
                {detail.stato === 'in_corso' && (
                  <button
                    disabled={updating === detail.id}
                    onClick={() => cambiaStato(detail.id, 'completato')}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Segna come completato
                  </button>
                )}
              </div>

              {/* FOTO */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Camera size={14} /> Foto intervento
                </h4>

                {detail.foto_paths?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {detail.foto_paths.map((path) => (
                      <div key={path} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                        {fotoUrls[path] ? (
                          <img src={fotoUrls[path]} alt="Foto intervento" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Image size={24} />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminaFoto(path) }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          title="Elimina"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-3">Nessuna foto caricata</p>
                )}

                <label className={'flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-600 hover:border-teal-400 hover:text-teal-700 cursor-pointer transition ' + (uploadingFoto ? 'opacity-50 pointer-events-none' : '')}>
                  <Camera size={18} />
                  {uploadingFoto ? 'Caricamento...' : 'Aggiungi foto'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={caricaFoto}
                    disabled={uploadingFoto}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-1.5 text-center">
                  Puoi scattare o selezionare più foto
                </p>
              </div>

              {/* NOTE */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <MessageSquare size={14} /> Note e aggiornamenti
                </h4>
                {detail.note_fornitore ? (
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap mb-3">
                    {detail.note_fornitore}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-3">Nessuna nota ancora</p>
                )}
                <div className="flex gap-2">
                  <input
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Aggiungi una nota..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={salvaNota}
                    disabled={savingNota || !nota.trim()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50"
                  >
                    {savingNota ? '...' : 'Salva'}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                Creato il {format(new Date(detail.created_at), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
