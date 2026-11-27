import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, User, Home, ArrowRight } from 'lucide-react'
import { enablePush, pushSupported } from '../../lib/push'

export default function CompletaProfilo() {
  const { user, profile, condominio, saveCondominoContact } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState((profile && profile.nome) || '')
  const [email, setEmail] = useState((profile && profile.email) || '')
  const [unita, setUnita] = useState((profile && profile.unita) || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function tryEnablePush() {
    if (!pushSupported()) {
      alert('Questo browser non supporta le notifiche push')
      return
    }
    const res = await enablePush({
      ruolo: 'condomino',
      user_id: user && user.id ? user.id : null,
      condominio_id: condominio && condominio.id ? condominio.id : null,
    })
    if (res && res.ok) {
      alert('Notifiche attivate correttamente')
    } else {
      alert('Notifiche non attivate: ' + ((res && res.error) || 'errore sconosciuto'))
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    const nomeClean = (nome || '').trim()
    if (nomeClean.length < 3) {
      setError('Inserisci nome e cognome')
      return
    }

    setLoading(true)
    const res = await saveCondominoContact({
      nome: nomeClean,
      email: (email || '').trim(),
      unita: (unita || '').trim(),
    })

    if (res.error) {
      setLoading(false)
      setError(res.error)
      return
    }

    await tryEnablePush()
    setLoading(false)
    navigate('/app', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-teal-50 text-teal-600 rounded-xl items-center justify-center mb-3">
            <User size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Chi sei?</h1>
          <p className="text-sm text-slate-500 mt-2">
            Per accedere a <strong>{condominio && condominio.nome}</strong> indica almeno
            nome e cognome. L&apos;email è facoltativa.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <User size={14} /> Nome e cognome *
            </label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Mario Rossi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Mail size={14} /> Email (facoltativa)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="mario.rossi@email.it"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Home size={14} /> Unità / interno (facoltativo)
            </label>
            <input
              value={unita}
              onChange={(e) => setUnita(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Es. Scala A – Interno 5"
            />
          </div>

          {error ? (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Salvataggio...' : 'Continua'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}