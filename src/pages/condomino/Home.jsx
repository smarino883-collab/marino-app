import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Calendar,
  FileText,
  ClipboardList,
  ExternalLink,
  Wrench,
  User,
  CalendarClock,
  Globe,
  Send,
  Bell,
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Home() {
  const { condominio } = useAuth()
  const [notizie, setNotizie] = useState([])
  const [loadingNotizie, setLoadingNotizie] = useState(true)

  useEffect(() => {
    if (!condominio) return
    loadNotizie()
  }, [condominio])

  async function loadNotizie() {
    setLoadingNotizie(true)
    const { data } = await supabase
      .from('notizie')
      .select('*')
      .eq('condominio_id', condominio.id)
      .order('published_at', { ascending: false })
      .limit(15)
    setNotizie(data || [])
    setLoadingNotizie(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{condominio && condominio.nome}</h1>
        <p className="text-sm text-slate-500">{condominio && condominio.indirizzo}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/app/documenti"
          className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700"
        >
          <FileText size={22} />
          <span className="text-sm font-medium">Documenti</span>
        </Link>
        <Link
          to="/app/convocazioni"
          className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 text-purple-700"
        >
          <ClipboardList size={22} />
          <span className="text-sm font-medium">Convocazioni</span>
        </Link>
        <Link
          to="/app/calendario"
          className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 text-teal-700"
        >
          <Calendar size={22} />
          <span className="text-sm font-medium">Calendario</span>
        </Link>
        <Link
          to="/app/interventi"
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 text-amber-700"
        >
          <Wrench size={22} />
          <span className="text-sm font-medium">Interventi</span>
        </Link>
      </div>

      {/* AVVISI / NOTIZIE */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <Bell size={14} /> Avvisi
        </h2>
        {loadingNotizie ? (
          <div className="text-sm text-slate-400">Caricamento...</div>
        ) : notizie.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center text-slate-400 text-sm border border-slate-100">
            Nessun avviso al momento
          </div>
        ) : (
          <div className="space-y-2">
            {notizie.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
              >
                <h3 className="font-medium text-slate-800">{n.titolo}</h3>
                {n.contenuto ? (
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.contenuto}</p>
                ) : null}
                <p className="text-xs text-slate-400 mt-2">
                  {n.published_at
                    ? format(new Date(n.published_at), "d MMM yyyy HH:mm", { locale: it })
                    : n.created_at
                      ? format(new Date(n.created_at), "d MMM yyyy HH:mm", { locale: it })
                      : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">Servizi online</h2>
        <div className="space-y-2">
          <a
            href="https://smarino.jimdofree.com/richieste/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border bg-sky-50 text-sky-800"
          >
            <Send size={20} />
            <span className="text-sm font-medium flex-1">Richieste</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://smarino.jimdofree.com/segnala-un-guasto/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border bg-orange-50 text-orange-800"
          >
            <Wrench size={20} />
            <span className="text-sm font-medium flex-1">Segnala un guasto</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://smarino.jimdofree.com/anagrafica/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border bg-violet-50 text-violet-800"
          >
            <User size={20} />
            <span className="text-sm font-medium flex-1">Aggiorna anagrafica</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://superagenda.online/marinoamministrazioni"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-50 text-emerald-800"
          >
            <CalendarClock size={20} />
            <span className="text-sm font-medium flex-1">Prendi un appuntamento</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://www.marinoamministrazioni.it"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 text-slate-800"
          >
            <Globe size={20} />
            <span className="text-sm font-medium flex-1">Sito web</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}