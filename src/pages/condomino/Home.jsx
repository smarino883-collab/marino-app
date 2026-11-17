import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Calendar,
  FileText,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Wrench,
  User,
  CalendarClock,
  Globe,
  Send,
} from 'lucide-react'

export default function Home() {
  const { condominio } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{condominio?.nome}</h1>
        <p className="text-sm text-slate-500">{condominio?.indirizzo}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/segnalazioni" className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 text-orange-700">
          <AlertTriangle size={22} />
          <span className="text-sm font-medium">Nuova segnalazione</span>
        </Link>
        <Link to="/app/documenti" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700">
          <FileText size={22} />
          <span className="text-sm font-medium">Documenti</span>
        </Link>
        <Link to="/app/convocazioni" className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 text-purple-700">
          <ClipboardList size={22} />
          <span className="text-sm font-medium">Convocazioni</span>
        </Link>
        <Link to="/app/calendario" className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 text-teal-700">
          <Calendar size={22} />
          <span className="text-sm font-medium">Calendario</span>
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">Servizi online</h2>
        <div className="space-y-2">
          <a href="https://smarino.jimdofree.com/richieste/" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border bg-sky-50 text-sky-800">
            <Send size={20} />
            <span className="text-sm font-medium flex-1">Richieste</span>
            <ExternalLink size={14} />
          </a>
          <a href="https://smarino.jimdofree.com/segnala-un-guasto/" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border bg-orange-50 text-orange-800">
            <Wrench size={20} />
            <span className="text-sm font-medium flex-1">Segnala un guasto</span>
            <ExternalLink size={14} />
          </a>
          <a href="https://smarino.jimdofree.com/anagrafica/" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border bg-violet-50 text-violet-800">
            <User size={20} />
            <span className="text-sm font-medium flex-1">Aggiorna anagrafica</span>
            <ExternalLink size={14} />
          </a>
          <a href="https://superagenda.online/marinoamministrazioni" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-50 text-emerald-800">
            <CalendarClock size={20} />
            <span className="text-sm font-medium flex-1">Prendi un appuntamento</span>
            <ExternalLink size={14} />
          </a>
          <a href="https://www.marinoamministrazioni.it" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 text-slate-800">
            <Globe size={20} />
            <span className="text-sm font-medium flex-1">Sito web</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}