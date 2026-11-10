import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Calendar, FileText, AlertTriangle, ClipboardList, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Home() {
  const { condominio } = useAuth()
  const [notizie, setNotizie] = useState([])
  const [prossimiEventi, setProssimiEventi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!condominio) return
    loadData()
  }, [condominio])

  async function loadData() {
    setLoading(true)
    const [nRes, eRes] = await Promise.all([
      supabase
        .from('notizie')
        .select('*')
        .eq('condominio_id', condominio.id)
        .order('published_at', { ascending: false })
        .limit(5),
      supabase
        .from('eventi')
        .select('*')
        .eq('condominio_id', condominio.id)
        .gte('data_inizio', new Date().toISOString())
        .order('data_inizio', { ascending: true })
        .limit(4)
    ])
    setNotizie(nRes.data || [])
    setProssimiEventi(eRes.data || [])
    setLoading(false)
  }

  const quickLinks = [
    { to: '/app/segnalazioni', icon: AlertTriangle, label: 'Nuova segnalazione', color: 'bg-orange-50 text-orange-700' },
    { to: '/app/documenti', icon: FileText, label: 'Documenti', color: 'bg-blue-50 text-blue-700' },
    { to: '/app/convocazioni', icon: ClipboardList, label: 'Convocazioni', color: 'bg-purple-50 text-purple-700' },
    { to: '/app/calendario', icon: Calendar, label: 'Calendario', color: 'bg-teal-50 text-teal-700' },
  ]

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{condominio?.nome}</h1>
        <p className="text-sm text-slate-500">{condominio?.indirizzo}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 p-4 rounded-xl ${item.color} hover:opacity-90 transition`}
          >
            <item.icon size={22} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Notizie */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Bell size={14} /> Avvisi recenti
        </h2>
        {notizie.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-sm">
            Nessun avviso al momento
          </div>
        ) : (
          <div className="space-y-3">
            {notizie.map((n) => (
              <div key={n.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-800">{n.titolo}</h3>
                  {n.importante && (
                    <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Importante
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{n.contenuto}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {n.published_at && format(new Date(n.published_at), 'd MMMM yyyy', { locale: it })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prossimi eventi */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar size={14} /> Prossimi appuntamenti
        </h2>
        {prossimiEventi.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-sm">
            Nessun evento in programma
          </div>
        ) : (
          <div className="space-y-2">
            {prossimiEventi.map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4">
                <div className="text-center shrink-0 w-12">
                  <div className="text-xs text-teal-600 font-medium uppercase">
                    {format(new Date(e.data_inizio), 'MMM', { locale: it })}
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {format(new Date(e.data_inizio), 'd')}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">{e.titolo}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{e.tipo?.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
