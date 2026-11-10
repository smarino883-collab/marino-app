import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { User, Phone, Mail, Wrench, Save } from 'lucide-react'

export default function FornitoreProfilo() {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    nome: profile?.nome || '',
    ragione_sociale: profile?.ragione_sociale || '',
    telefono: profile?.telefono || '',
    email: profile?.email || '',
    specializzazione: profile?.specializzazione || '',
    note: profile?.note || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('fornitori')
      .update({
        nome: form.nome,
        ragione_sociale: form.ragione_sociale,
        telefono: form.telefono,
        email: form.email,
        specializzazione: form.specializzazione,
        note: form.note,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      setMsg('Errore nel salvataggio')
    } else {
      setMsg('Profilo aggiornato')
      // Aggiorna sessione locale
      const saved = localStorage.getItem('marino_session')
      if (saved) {
        const session = JSON.parse(saved)
        session.profile = { ...session.profile, ...form }
        localStorage.setItem('marino_session', JSON.stringify(session))
      }
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-slate-800">Il mio profilo</h1>

      <div className="bg-white rounded-xl p-5 border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <User size={28} />
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              {form.ragione_sociale || form.nome || 'Fornitore'}
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <Wrench size={12} /> {form.specializzazione || '—'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ragione sociale</label>
            <input
              value={form.ragione_sociale}
              onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Referente</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Phone size={14} /> Telefono
            </label>
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specializzazione</label>
            <input
              value={form.specializzazione}
              onChange={(e) => setForm({ ...form, specializzazione: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Es. Idraulico, Elettricista..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {msg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${msg.includes('Errore') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>
    </div>
  )
}
