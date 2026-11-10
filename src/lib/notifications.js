import { queuePush } from './push'
import { supabase } from './supabase'

/**
 * Coda notifiche email.
 * Scrive su tabella `email_queue` (da processare con Edge Function + provider email).
 * In mancanza della tabella, fallisce in silenzio per non bloccare l'UI.
 */

export async function queueEmail({ to, subject, body, tipo, riferimento_id, condominio_id }) {
  if (!to || !subject) return { ok: false, error: 'Destinatario o oggetto mancanti' }

  try {
    const { error } = await supabase.from('email_queue').insert({
      to_email: to,
      subject,
      body,
      tipo: tipo || 'generico',
      riferimento_id: riferimento_id || null,
      condominio_id: condominio_id || null,
      stato: 'pending',
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/** Notifica admin: nuova segnalazione */
export async function notifyAdminNuovaSegnalazione({ condominioNome, titolo, adminEmail, condominio_id, segnalazione_id }) {
  await queuePush({
    title: 'Nuova segnalazione',
    body: `${titolo}${condominioNome ? ' – ' + condominioNome : ''}`,
    url: '/admin/interventi',
    ruolo: 'admin',
  })
  if (!adminEmail) return
  return queueEmail({
    to: adminEmail,
    subject: `[Marino Amministrazioni] Nuova segnalazione – ${condominioNome || 'Condominio'}`,
    body: `È stata ricevuta una nuova segnalazione.\n\nCondominio: ${condominioNome || '—'}\nTitolo: ${titolo}\n\nAccedi all'app per gestirla.`,
    tipo: 'nuova_segnalazione',
    riferimento_id: segnalazione_id,
    condominio_id,
  })
}

/** Notifica fornitore: intervento assegnato */
export async function notifyFornitoreInterventoAssegnato({ fornitoreEmail, titolo, condominioNome, intervento_id, condominio_id, fornitore_id }) {
  await queuePush({
    title: 'Nuovo intervento assegnato',
    body: `${titolo}${condominioNome ? ' – ' + condominioNome : ''}`,
    url: '/fornitore/interventi',
    ruolo: 'fornitore',
    fornitore_id: fornitore_id || null,
  })
  if (!fornitoreEmail) return
  return queueEmail({
    to: fornitoreEmail,
    subject: `[Marino Amministrazioni] Nuovo intervento assegnato`,
    body: `Ti è stato assegnato un nuovo intervento.\n\nTitolo: ${titolo}\nCondominio: ${condominioNome || '—'}\n\nAccedi all'area fornitori per prenderlo in carico.`,
    tipo: 'intervento_assegnato',
    riferimento_id: intervento_id,
    condominio_id,
  })
}

/** Notifica condomini: nuova convocazione (lista email) */
export async function notifyCondominiConvocazione({ emails, titolo, dataAssemblea, condominioNome, condominio_id, convocazione_id }) {
  await queuePush({
    title: 'Nuova convocazione di assemblea',
    body: `${titolo}${condominioNome ? ' · ' + condominioNome : ''}`,
    url: '/app/convocazioni',
    ruolo: 'condomino',
    condominio_id: condominio_id || null,
  })
  // recupera email facoltative salvate dai condomini
  let list = emails || []
  if (condominio_id) {
    try {
      const { data } = await supabase
        .from('condomini_contatti')
        .select('email')
        .eq('condominio_id', condominio_id)
        .not('email', 'is', null)
      const fromDb = (data || []).map((r) => r.email).filter(Boolean)
      list = [...new Set([...list, ...fromDb])]
    } catch (_) {}
  }
  if (!list?.length) return
  emails = list
  const dataStr = dataAssemblea ? `\nData assemblea: ${dataAssemblea}` : ''
  const results = []
  for (const to of list) {
    results.push(
      await queueEmail({
        to,
        subject: `[Marino Amministrazioni] Nuova convocazione – ${condominioNome || 'Condominio'}`,
        body: `È disponibile una nuova convocazione di assemblea.\n\nTitolo: ${titolo}${dataStr}\nCondominio: ${condominioNome || '—'}\n\nAccedi all'app per scaricarla e firmare per presa visione.`,
        tipo: 'nuova_convocazione',
        riferimento_id: convocazione_id,
        condominio_id,
      })
    )
  }
  return results
}

/** Notifica su cambio stato intervento (opzionale verso admin) */
export async function notifyAdminStatoIntervento({ adminEmail, titolo, stato, condominioNome, intervento_id }) {
  if (!adminEmail) return
  return queueEmail({
    to: adminEmail,
    subject: `[Marino Amministrazioni] Intervento aggiornato: ${stato}`,
    body: `Lo stato di un intervento è stato aggiornato.\n\nTitolo: ${titolo}\nNuovo stato: ${stato}\nCondominio: ${condominioNome || '—'}\n\nAccedi all'app per i dettagli.`,
    tipo: 'stato_intervento',
    riferimento_id: intervento_id,
  })
}
