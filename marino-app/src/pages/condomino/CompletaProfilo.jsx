import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, User, Home, ArrowRight } from 'lucide-react'

export default function CompletaProfilo() {
  const { profile, condominio, saveCondominoContact } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState(profile?.nome || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [unita, setUnita] = useState(profile?.unita || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await saveCondominoContact({ nome, email, unita, skip: false })
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    navigate('/app', { replace: true })
  }

  async function handleSkip() {
    setLoading(true)
    await saveCondominoContact({ skip: true })
    setLoading(false)
    navigate('/app', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-teal-50 text-teal-600 rounded-xl items-center justify-center mb-3">
            <Mail size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">I tuoi dati (facoltativi)</h1>
          <p className="text-sm text-slate-500 mt-2">
            Per <strong>{condominio?.nome}</strong>. L’email serve per ricevere le convocazioni
            anche in casella di posta. Puoi saltare e compilare dopo.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <User size={14} /> Nome e cognome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Opzionale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="es. mario.rossi@email.it (opzionale)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Home size={14} /> Unità / interno
            </label>
            <input
              value={unita}
              onChange={(e) => setUnita(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Es. Scala A – Interno 5 (opzionale)"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            Salva e continua
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full text-sm text-slate-500 py-2 hover:text-slate-700"
          >
            Salta per ora
          </button>
        </form>
      </div>
    </div>
  )
}
