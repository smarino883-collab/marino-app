import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Wrench, Clock, Play, CheckCircle, User } from 'lucide-react'

export default function FornitoreDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ da_aprire: 0, aperto: 0, in_corso: 0, completato: 0 })
  const [recenti, setRecenti] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('interventi')
      .select(`
        id, titolo, stato, created_at, updated_at,
        condominio:condomini(nome, indirizzo)
      `)
      .eq('fornitore_id', profile.id)
      .order('updated_at', { ascending: false })

    const list = data || []
    setStats({
      da_aprire: list.filter((i) => i.stato === 'da_aprire').length,
      aperto: list.filter((i) => i.stato === 'aperto').length,
      in_corso: list.filter((i) => i.stato === 'in_corso').length,
      completato: list.filter((i) => i.stato === 'completato').length,
    })
    setRecenti(list.slice(0, 5))
    setLoading(false)
  }

  const cards = [
    { key: 'da_aprire', label: 'Da aprire', icon: Clock, color: 'bg-slate-100 text-slate-700' },
    { key: 'aperto', label: 'Aperti', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
    { key: 'in_corso', label: 'In corso', icon: Play, color: 'bg-amber-100 text-amber-700' },
    { key: 'completato', label: 'Completati', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Ciao, {profile?.nome || profile?.ragione_sociale || 'Fornitore'}
        </h1>
        <p className="text-sm text-slate-500">{profile?.specializzazione}</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map((c) => (
              <Link
                key={c.key}
                to="/fornitore/interventi"
                className={`p-4 rounded-xl ${c.color} hover:opacity-90 transition`}
              >
                <c.icon size={20} className="mb-2 opacity-70" />
                <div className="text-2xl font-bold">{stats[c.key]}</div>
                <div className="text-xs opacity-80">{c.label}</div>
              </Link>
            ))}
          </div>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase">Ultimi interventi</h2>
              <Link to="/fornitore/interventi" className="text-sm text-teal-600 hover:underline">
                Vedi tutti
              </Link>
            </div>
            {recenti.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-sm">
                Nessun intervento assegnato
              </div>
            ) : (
              <div className="space-y-2">
                {recenti.map((i) => (
                  <Link
                    key={i.id}
                    to="/fornitore/interventi"
                    className="block bg-white rounded-xl p-4 border border-slate-100 hover:border-teal-200 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-slate-800 truncate">{i.titolo}</h3>
                      <span className="text-xs text-slate-400 shrink-0 capitalize">{i.stato?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{i.condominio?.nome}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Link
            to="/fornitore/profilo"
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100 hover:border-teal-200 transition"
          >
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <div className="font-medium text-slate-800">Il mio profilo</div>
              <div className="text-xs text-slate-500">Dati e contatti</div>
            </div>
          </Link>
        </>
      )}
    </div>
  )
}
