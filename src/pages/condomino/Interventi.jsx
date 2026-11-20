import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const STATI = {
  da_aprire: { label: 'Da aprire', color: 'bg-slate-100 text-slate-700' },
  aperto: { label: 'Aperto', color: 'bg-blue-100 text-blue-700' },
  in_corso: { label: 'In corso', color: 'bg-amber-100 text-amber-700' },
  completato: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  chiuso: { label: 'Chiuso', color: 'bg-slate-100 text-slate-500' },
}

export default function InterventiCondomino() {
  const { condominio } = useAuth()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (condominio) load()
  }, [condominio])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('interventi')
      .select('*, fornitore:fornitori(nome, ragione_sociale)')
      .eq('condominio_id', condominio.id)
      .order('created_at', { ascending: false })
    setLista(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Interventi e lavori</h1>
      <p className="text-sm text-slate-500">
        Interventi gestiti dall&apos;amministratore per il tuo condominio.
      </p>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-sm">
          <Wrench className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun intervento al momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((i) => {
            const st = STATI[i.stato] || STATI.da_aprire
            return (
              <div key={i.id} className="bg-white rounded-xl border p-4">
                <div className="flex justify-between gap-2">
                  <h3 className="font-medium">{i.titolo}</h3>
                  <span className={'text-xs px-2 py-0.5 rounded-full shrink-0 ' + st.color}>
                    {st.label}
                  </span>
                </div>
                {i.descrizione ? <p className="text-sm text-slate-600 mt-1">{i.descrizione}</p> : null}
                <p className="text-xs text-slate-400 mt-2">
                  {i.fornitore
                    ? 'Fornitore: ' + (i.fornitore.ragione_sociale || i.fornitore.nome)
                    : 'Fornitore non ancora assegnato'}
                  {i.created_at
                    ? ' · ' + format(new Date(i.created_at), 'd MMM yyyy', { locale: it })
                    : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}