import { Link } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] text-white py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <div className="font-semibold">marinoamministrazioni.it</div>
            <div className="text-xs text-slate-300">Informativa privacy</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-teal-700 hover:underline mb-6">
          <ArrowLeft size={16} /> Torna all'app
        </Link>

        <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 text-slate-700 text-sm leading-relaxed">
          <h1 className="text-2xl font-bold text-slate-900">Informativa sul trattamento dei dati personali</h1>
          <p className="text-slate-500 text-xs">
            Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)
          </p>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">1. Titolare del trattamento</h2>
            <p>
              Il Titolare del trattamento è <strong>Salvatore Marino – Amministrazioni Condominiali</strong>
              (di seguito “Titolare”), con riferimento ai servizi digitali accessibili tramite
              l’applicazione e il sito <strong>www.marinoamministrazioni.it</strong>.
            </p>
            <p className="mt-2">
              Per esercitare i diritti o per richieste relative alla privacy:
              contattare il Titolare tramite i recapiti indicati sul sito istituzionale.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">2. Dati trattati</h2>
            <p>Possono essere trattati, a seconda del profilo utente:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>dati anagrafici e di contatto (nome, email, telefono)</li>
              <li>codice di accesso al condominio e dati relativi all’unità immobiliare</li>
              <li>contenuti inseriti in app (segnalazioni, messaggi, note)</li>
              <li>documenti e file caricati (PDF, immagini)</li>
              <li>firme di presa visione delle convocazioni (nome, data/ora)</li>
              <li>dati tecnici di accesso (log, indirizzo IP ove necessario per sicurezza)</li>
              <li>foto relative a interventi e segnalazioni</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">3. Finalità e base giuridica</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Gestione del rapporto con i condomini e fornitori</strong> (esecuzione di misure
                precontrattuali e contrattuali / legittimo interesse legato all’amministrazione condominiale)
              </li>
              <li>
                <strong>Comunicazioni operative</strong> (convocazioni, avvisi, stato interventi) –
                anche tramite email, sulla base del rapporto in essere e, ove richiesto, del consenso
              </li>
              <li>
                <strong>Sicurezza e prevenzione abusi</strong> (legittimo interesse)
              </li>
              <li>
                <strong>Adempimenti di legge</strong> connessi all’attività di amministrazione di condominio
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">4. Modalità del trattamento</h2>
            <p>
              I dati sono trattati con strumenti informatici, con logiche correlate alle finalità
              indicate e con misure tecniche e organizzative adeguate a proteggerli da accessi non
              autorizzati, perdita o uso illecito (tra cui controllo accessi, separazione per condominio,
              tracciamento delle operazioni rilevanti).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">5. Destinatari</h2>
            <p>I dati possono essere comunicati a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>soggetti autorizzati dal Titolare (collaboratori)</li>
              <li>fornitori di servizi tecnici (hosting, database, invio email), nominati responsabili del trattamento ove previsto</li>
              <li>fornitori incaricati di interventi tecnici, limitatamente ai dati necessari all’esecuzione del lavoro</li>
              <li>autorità competenti, ove obbligatorio per legge</li>
            </ul>
            <p className="mt-2">I dati non sono destinati a diffusione pubblica.</p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">6. Trasferimenti extra-UE</h2>
            <p>
              Qualora fornitori tecnici operino anche fuori dallo Spazio Economico Europeo, il trasferimento
              avverrà solo con garanzie adeguate previste dal GDPR (es. clausole contrattuali standard).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">7. Conservazione</h2>
            <p>
              I dati sono conservati per il tempo necessario alle finalità indicate e agli obblighi di legge
              tipici dell’amministrazione condominiale (documentazione assembleare, contabile e gestionale).
              Decessi e log tecnici possono essere conservati per periodi più brevi, compatibili con esigenze
              di sicurezza.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">8. Diritti dell’interessato</h2>
            <p>L’interessato può chiedere al Titolare:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>accesso ai dati</li>
              <li>rettifica o aggiornamento</li>
              <li>cancellazione, nei limiti di legge</li>
              <li>limitazione del trattamento</li>
              <li>opposizione, per motivi connessi alla situazione particolare</li>
              <li>portabilità, ove applicabile</li>
              <li>revoca del consenso, ove il trattamento si basi sul consenso</li>
            </ul>
            <p className="mt-2">
              È inoltre possibile proporre reclamo al Garante per la protezione dei dati personali
              (www.garanteprivacy.it).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">9. Natura del conferimento</h2>
            <p>
              Il conferimento dei dati necessari all’accesso e all’uso dell’app è funzionale alla
              prestazione del servizio. Il rifiuto può impedire l’utilizzo di alcune o tutte le funzioni.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-2">10. Aggiornamenti</h2>
            <p>
              La presente informativa può essere aggiornata. La versione corrente è sempre disponibile
              in app alla sezione Privacy.
            </p>
            <p className="text-xs text-slate-400 mt-3">Ultimo aggiornamento: novembre 2026</p>
          </section>
        </article>
      </main>
    </div>
  )
}
