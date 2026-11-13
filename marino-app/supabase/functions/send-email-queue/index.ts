// Supabase Edge Function: processa la coda email_queue
// Deploy: supabase functions deploy send-email-queue
// Schedula con cron (es. ogni minuto) oppure chiamala dopo insert
//
// Secrets richiesti:
//   RESEND_API_KEY  (o altro provider)
//   FROM_EMAIL      es. notifiche@marinoamministrazioni.it

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: pending, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('stato', 'pending')
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const row of pending || []) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [row.to_email],
          subject: row.subject,
          text: row.body,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        await supabase
          .from('email_queue')
          .update({ stato: 'error', error_message: errText })
          .eq('id', row.id)
        failed++
        continue
      }

      await supabase
        .from('email_queue')
        .update({ stato: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (e) {
      await supabase
        .from('email_queue')
        .update({ stato: 'error', error_message: String(e) })
        .eq('id', row.id)
      failed++
    }
  }

  return new Response(JSON.stringify({ processed: (pending || []).length, sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
