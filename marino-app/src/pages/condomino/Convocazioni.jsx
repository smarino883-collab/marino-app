import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { ClipboardList, Download, PenLine, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Convocazioni() {
  const { condominio, user, profile } = useAuth()
  const [lista, setLista] = useState([])
  const [firme, setFirme] = useState({})
  const [loading, setLoading] = useState(true)
  const [firmando, setFirmando] = useState(null)
  const [nomeFirma, setNomeFirma] = useState('')

  useEffect(() => {
    if (condominio) load()
  }, [condominio])

  async function load() {
    setLoading(true)
    const { data: conv } = await supabase
      .from('convocazioni')
      .select('*')
      .eq('condominio_id', condominio.id)
      .order('created_at', { ascending: false })

    setLista(conv || [])

    if (conv?.length) {
      const { data: firmeData } = await supabase
        .from('convocazioni_firme')
        .select('*')
        .in('convocazione_id', conv.map((c) => c.id))
        .eq('user_id', user.id)

      const map = {}
      ;(firmeData || []).forEach((f) => { map[f.convocazione_id] = f })
      setFirme(map)
    }
    setLoading(false)
  }

  async function download(conv) {
    if (!conv.file_path) return
    const { data, error } = await supabase.storage
      .from('convocazioni')
      .download(conv.file_path)
    if (error) {
      alert('Errore download')
      return
    }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = conv.titolo + '.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function confermaFirma() {
    if (!nomeFirma.trim() || !firmando) return
    const { error } = await supabase.from('convocazioni_firme').insert({
      convocazione_id: firmando,
      user_id: user.id,
      nome_firmatario: nomeFirma.trim(),
      tipo_firma: 'presa_visione',
    })
    if (!error) {
      setFirmando(null)
      setNomeFirma('')
      load()
    } else {
      alert('Errore nella firma: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Convocazioni</h1>
      <p className="text-sm text-slate-500">Scarica e firma per presa visione le convocazioni di assemblea</p>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <ClipboardList className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessuna convocazione presente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => {
            const firmata = firme[c.id]
            return (
              <div key={c.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-slate-800">{c.titolo}</h3>
                    {c.data_assemblea && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        Assemblea: {format(new Date(c.data_assemblea), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                      </p>
                    )}
                    {c.luogo && <p className="text-sm text-slate-500">Luogo: {c.luogo}</p>}
                  </div>
                  {firmata && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">
                      <CheckCircle size={12} /> Firmata
                    </span>
                  )}
                </div>

                {c.note && <p className="text-sm text-slate-600 mt-2">{c.note}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  {c.file_path && (
                    <button
                      onClick={() => download(c)}
                      className="flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                    >
                      <Download size={14} /> Scarica
                    </button>
                  )}
                  {!firmata && (
                    <button
                      onClick={() => {
                        setFirmando(c.id)
                        setNomeFirma(profile?.nome || '')
                      }}
                      className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700"
                    >
                      <PenLine size={14} /> Firma per presa visione
                    </button>
                  )}
                </div>

                {firmata && (
                  <p className="text-xs text-slate-400 mt-2">
                    Firmato da {firmata.nome_firmatario} il {format(new Date(firmata.firmato_at), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal firma */}
      {firmando && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Firma per presa visione</h2>
              <button onClick={() => setFirmando(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Dichiaro di aver preso visione della convocazione. Inserisci il tuo nome e cognome per confermare.
            </p>
            <input
              value={nomeFirma}
              onChange={(e) => setNomeFirma(e.target.value)}
              placeholder="Nome e cognome"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <button
              onClick={confermaFirma}
              disabled={!nomeFirma.trim()}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              Conferma firma
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
