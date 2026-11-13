import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { enablePush, disablePush, pushSupported, getPermissionState } from '../lib/push'

export default function PushPrompt() {
  const { user, profile, condominio } = useAuth()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('unknown') // unknown | unsupported | default | granted | denied
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    ;(async () => {
      if (!pushSupported()) {
        setStatus('unsupported')
        return
      }
      const perm = await getPermissionState()
      setStatus(perm)
      const dismissed = localStorage.getItem('marino_push_dismissed')
      const enabled = localStorage.getItem('marino_push_enabled')
      if (perm === 'default' && !dismissed) setOpen(true)
      if (perm === 'granted' && !enabled) {
        // ripristina subscription se permesso già ok
        await handleEnable(true)
      }
    })()
  }, [user])

  async function handleEnable(silent = false) {
    setLoading(true)
    setError('')
    const meta = {
      user_id: user?.id || null,
      ruolo: profile?.type || null,
      condominio_id: condominio?.id || null,
      fornitore_id: profile?.type === 'fornitore' ? profile?.id : null,
    }
    const res = await enablePush(meta)
    setLoading(false)
    if (!res.ok) {
      if (!silent) setError(res.error || 'Errore attivazione')
      setStatus(await getPermissionState())
      return
    }
    setStatus('granted')
    setOpen(false)
  }

  async function handleDisable() {
    setLoading(true)
    await disablePush()
    setLoading(false)
    setStatus('default')
  }

  function dismiss() {
    localStorage.setItem('marino_push_dismissed', '1')
    setOpen(false)
  }

  if (!user || status === 'unsupported') return null

  return (
    <>
      {/* Banner primo accesso */}
      {open && status === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm">Attiva le notifiche</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ricevi avvisi sul telefono per convocazioni, interventi e segnalazioni.
              </p>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEnable(false)}
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white text-sm py-2 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Attivazione...' : 'Attiva'}
                </button>
                <button onClick={dismiss} className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl">
                  Non ora
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle compatto in basso a destra se già deciso */}
      {!open && status !== 'unsupported' && (
        <button
          onClick={() => (status === 'granted' ? handleDisable() : handleEnable(false))}
          disabled={loading || status === 'denied'}
          title={status === 'granted' ? 'Disattiva notifiche' : status === 'denied' ? 'Notifiche bloccate dal browser' : 'Attiva notifiche'}
          className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-white border border-slate-200 text-teal-700 hover:bg-teal-50 disabled:opacity-50"
        >
          {status === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      )}
    </>
  )
}
