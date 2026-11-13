// Edge Function: invia le push in coda (web-push)
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// Deploy: supabase functions deploy send-push-queue

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:info@marinoamministrazioni.it'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: jobs } = await supabase
    .from('push_queue')
    .select('*')
    .eq('stato', 'pending')
    .order('created_at', { ascending: true })
    .limit(30)

  let sent = 0
  let failed = 0

  for (const job of jobs || []) {
    let query = supabase.from('push_subscriptions').select('*')
    if (job.fornitore_id) query = query.eq('fornitore_id', job.fornitore_id)
    else if (job.condominio_id) query = query.eq('condominio_id', job.condominio_id)
    else if (job.ruolo) query = query.eq('ruolo', job.ruolo)
    else if (job.user_id) query = query.eq('user_id', job.user_id)

    const { data: subs } = await query
    if (!subs?.length) {
      await supabase.from('push_queue').update({ stato: 'sent', sent_at: new Date().toISOString() }).eq('id', job.id)
      continue
    }

    const payload = JSON.stringify({
      title: job.title,
      body: job.body,
      url: job.url || '/',
    })

    let jobOk = true
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sent++
      } catch (e: any) {
        jobOk = false
        failed++
        // subscription scaduta
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    await supabase
      .from('push_queue')
      .update({
        stato: jobOk ? 'sent' : 'error',
        sent_at: new Date().toISOString(),
        error_message: jobOk ? null : 'Alcuni invii falliti',
      })
      .eq('id', job.id)
  }

  return new Response(JSON.stringify({ jobs: jobs?.length || 0, sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
