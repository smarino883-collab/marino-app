import { useEffect, useState } from 'react'
import { Share, Plus, X, Smartphone, Download } from 'lucide-react'

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(null) // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem('marino_install_dismissed')) return

    const onBip = (e) => {
      e.preventDefault()
      setDeferred(e)
      setMode('android')
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)

    // iOS non ha beforeinstallprompt: mostra istruzioni dopo un breve delay al primo accesso
    const t = setTimeout(() => {
      if (localStorage.getItem('marino_install_dismissed')) return
      if (isStandalone()) return
      if (isIos()) {
        setMode('ios')
        setOpen(true)
      } else if (!deferred && isAndroid()) {
        // Android senza evento ancora: mostra comunque guida manuale
        setMode('android-manual')
        setOpen(true)
      }
    }, 2500)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('marino_install_dismissed', '1')
    setOpen(false)
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem('marino_install_dismissed', '1')
    }
    setDeferred(null)
    setOpen(false)
  }

  if (!open || isStandalone()) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800">Aggiungi alla Home</h3>
            <p className="text-sm text-slate-500 mt-1">
              Usa l’app come un’icona sul telefono, senza passare dallo store.
            </p>

            {(mode === 'android' || mode === 'desktop') && deferred && (
              <button
                onClick={install}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700"
              >
                <Download size={16} />
                Installa app
              </button>
            )}

            {(mode === 'ios' || mode === 'android-manual') && (
              <ol className="mt-3 text-sm text-slate-600 space-y-2 list-decimal pl-4">
                {mode === 'ios' ? (
                  <>
                    <li className="flex flex-wrap items-center gap-1">
                      Tocca <Share size={14} className="inline text-blue-500" /> <strong>Condividi</strong> in Safari
                    </li>
                    <li className="flex flex-wrap items-center gap-1">
                      Scegli <Plus size={14} className="inline" /> <strong>Aggiungi a Home</strong>
                    </li>
                    <li>Conferma con <strong>Aggiungi</strong></li>
                  </>
                ) : (
                  <>
                    <li>Apri il menu del browser (⋮)</li>
                    <li>Scegli <strong>Installa app</strong> o <strong>Aggiungi a Home</strong></li>
                  </>
                )}
              </ol>
            )}

            <button
              onClick={dismiss}
              className="mt-3 w-full text-sm text-slate-500 py-2 hover:text-slate-700"
            >
              Non ora
            </button>
          </div>
          <button onClick={dismiss} className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
