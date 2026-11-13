import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Building2, Wrench, AlertTriangle, Users, FileText } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    condomini: 0,
    segnalazioniAperte: 0,
    interventiInCorso: 0,
    fornitori: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const [c, s, i, f] = await Promise.all([
      supabase.from('condomini').select('id', { count: 'exact', head: true }),
      supabase.from('segnalazioni').select('id', { count: 'exact', head: true }).in('stato', ['ricevuta', 'in_lavorazione']),
      supabase.from('interventi').select('id', { count: 'exact', head: true }).in('stato', ['da_aprire', 'aperto', 'in_corso']),
      supabase.from('fornitori').select('id', { count: 'exact', head: true }).eq('attivo', true),
    ])
    setStats({
      condomini: c.count || 0,
      segnalazioniAperte: s.count || 0,
      interventiInCorso: i.count || 0,
      fornitori: f.count || 0,
    })
    setLoading(false)
  }

  const cards = [
    { label: 'Condomini', value: stats.condomini, icon: Building2, to: '/admin/condomini', color: 'text-blue-600 bg-blue-50' },
    { label: 'Segnalazioni aperte', value: stats.segnalazioniAperte, icon: AlertTriangle, to: '/admin/interventi', color: 'text-orange-600 bg-orange-50' },
    { label: 'Interventi attivi', value: stats.interventiInCorso, icon: Wrench, to: '/admin/interventi', color: 'text-amber-600 bg-amber-50' },
    { label: 'Fornitori', value: stats.fornitori, icon: Users, to: '/admin/fornitori', color: 'text-teal-600 bg-teal-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Dashboard Amministratore</h1>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color} mb-3`}>
                <c.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-800">{c.value}</div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-3">Azioni rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/condomini" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
            Nuovo condominio
          </Link>
          <Link to="/admin/interventi" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
            Gestisci interventi
          </Link>
          <Link to="/admin/fornitori" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
            Fornitori
          </Link>
          <Link to="/admin/convocazioni" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
            Nuova convocazione
          </Link>
        </div>
      </div>
    </div>
  )
}
