import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  return reg
}

export async function getPermissionState() {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission // granted | denied | default
}

/**
 * Chiede permesso, sottoscrive e salva su Supabase.
 * meta: { user_id, ruolo, condominio_id, fornitore_id }
 */
export async function enablePush(meta = {}) {
  if (!pushSupported()) {
    return { ok: false, error: 'Push non supportate su questo dispositivo/browser' }
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: 'Chiave VAPID non configurata (VITE_VAPID_PUBLIC_KEY)' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Permesso notifiche negato' }
  }

  const reg = await registerServiceWorker()
  if (!reg) return { ok: false, error: 'Service worker non registrato' }

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_id: meta.user_id || null,
      ruolo: meta.ruolo || null,
      condominio_id: meta.condominio_id || null,
      fornitore_id: meta.fornitore_id || null,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  if (error) return { ok: false, error: error.message }
  localStorage.setItem('marino_push_enabled', '1')
  return { ok: true, subscription }
}

export async function disablePush() {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
  localStorage.removeItem('marino_push_enabled')
}

/** Accoda una push (inviata dalla Edge Function) */
export async function queuePush({ title, body, url, user_id, ruolo, condominio_id, fornitore_id }) {
  try {
    const { error } = await supabase.from('push_queue').insert({
      title: title || 'Marino Amministrazioni',
      body: body || '',
      url: url || '/',
      user_id: user_id || null,
      ruolo: ruolo || null,
      condominio_id: condominio_id || null,
      fornitore_id: fornitore_id || null,
      stato: 'pending',
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}
