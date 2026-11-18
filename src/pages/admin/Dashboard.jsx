import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Building2, Wrench, Users } from 'lucide-react'

export default function AdminDashboard() {
  const [condomini, setCondomini] = useState(0)
  const [interventi, setInterventi] = useState(0)
  const [fornitori, setFornitori] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, i, f] = await Promise.all([
        supabase.from('condomini').select('id', { count: 'exact', head: true }),
        supabase.from('interventi').select('id', { count: 'exact', head: true }).in('stato', ['da_aprire', 'aperto', 'in_corso']),
        supabase.from('fornitori').select('id', { count: 'exact', head: true }).eq('attivo', true),
      ])
      setCondomini(c.count || 0)
      setInterventi(i.count || 0)
      setFornitori(f.count || 0)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Dashboard Amministratore</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link to="/admin/condomini" className="bg-white rounded-xl p-5 border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <div className="text-2xl font-bold">{condomini}</div>
          <div className="text-sm text-slate-500">Condomini</div>
        </Link>

        <Link to="/admin/interventi" className="bg-white rounded-xl p-5 border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Wrench size={20} />
          </div>
          <div className="text-2xl font-bold">{interventi}</div>
          <div className="text-sm text-slate-500">Interventi attivi</div>
        </Link>

        <Link to="/admin/fornitori" className="bg-white rounded-xl p-5 border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <div className="text-2xl font-bold">{fornitori}</div>
          <div className="text-sm text-slate-500">Fornitori</div>
        </Link>
      </div>

      <div className="bg-white rounded-xl p-5 border">
        <h2 className="font-semibold mb-3">Azioni rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/condomini" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">Nuovo condominio</Link>
          <Link to="/admin/interventi" className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Interventi</Link>
          <Link to="/admin/fornitori" className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Fornitori</Link>
          <Link to="/admin/convocazioni" className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Convocazioni</Link>
          <Link to="/admin/avvisi" className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Avvisi</Link>
        </div>
      </div>
    </div>
  )
}