import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Wrench, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import InstallPrompt from '../components/InstallPrompt'

export default function Login() {
  const [tab, setTab] = useState('condomino')
  const [codice, setCodice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [privacyOk, setPrivacyOk] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithCode, loginFornitore, loginAdmin } = useAuth()
  const navigate = useNavigate()

  async function saveConsent(ruolo, userId, sessionKey) {
    try {
      await supabase.from('privacy_consents').insert({
        user_id: userId || null,
        session_key: sessionKey || null,
        ruolo,
        privacy_version: '2026-11',
      })
    } catch (_) {}
    localStorage.setItem('marino_privacy_accepted', '2026-11')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!privacyOk) {
      setError("Per continuare devi accettare l'informativa privacy")
      return
    }
    setLoading(true)

    try {
      let result
      if (tab === 'condomino') {
        result = await loginWithCode(codice)
        if (result.error) throw new Error(result.error)
        await saveConsent('condomino', null, `condo_${result.data?.condominio?.id}`)
        if (result.data?.needsContact) {
          navigate('/app/completa-profilo')
        } else {
          navigate('/app')
        }
      } else if (tab === 'fornitore') {
        result = await loginFornitore(email, password)
        if (result.error) throw new Error(result.error)
        await saveConsent('fornitore', result.data?.user?.id, null)
        navigate('/fornitore')
      } else {
        result = await loginAdmin(email, password)
        if (result.error) throw new Error(result.error)
        await saveConsent('admin', result.data?.user?.id, null)
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Errore di accesso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-[#1e3a5f] text-white py-8 px-4 text-center">
        <div className="mb-4 flex justify-center">
          <div className="bg-white rounded-2xl p-3 shadow-md">
            <img
              src={'/logo.png?t=' + Date.now()}
              alt="Logo Marino Amministrazioni"
              style={{ height: 80, width: 'auto', maxWidth: 240, display: 'block' }}
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">marinoamministrazioni.it</h1>
        <p className="text-slate-300 text-sm mt-1">Amministrazione condomini e servizi</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
            {[
              { id: 'condomino', icon: Building2, label: 'Condomino' },
              { id: 'fornitore', icon: Wrench, label: 'Fornitore' },
              { id: 'admin', icon: Shield, label: 'Admin' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? 'bg-white shadow text-teal-700' : 'text-slate-500'
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'condomino' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Codice di accesso del condominio
                </label>
                <input
                  type="text"
                  value={codice}
                  onChange={(e) =>
                    setCodice(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                  }
                  placeholder="Es. K7M2P9QX"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-xl tracking-[0.25em] font-mono uppercase"
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Codice alfanumerico fornito dall'amministratore
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </>
            )}

            <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyOk}
                onChange={(e) => setPrivacyOk(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>
                Ho letto e accetto l'{' '}
                <Link to="/privacy" className="text-teal-700 underline" target="_blank">
                  informativa privacy
                </Link>{' '}
                (GDPR)
              </span>
            </label>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-6 space-y-1">
        <div>© {new Date().getFullYear()} Salvatore Marino – Amministrazioni Condominiali</div>
        <Link to="/privacy" className="text-teal-700 hover:underline">
          Informativa privacy
        </Link>
      </footer>
      <InstallPrompt />
    </div>
  )
}