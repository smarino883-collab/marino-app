import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Send, X } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Comunicazioni() {
  const { condominio, user } = useAuth()
  const [messaggi, setMessaggi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ oggetto: '', messaggio: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (condominio) load()
  }, [condominio])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('comunicazioni')
      .select('*')
      .eq('condominio_id', condominio.id)
      .or(`mittente_id.eq.${user.id},destinatario_id.eq.${user.id},destinatario_id.is.null`)
      .order('created_at', { ascending: false })
    setMessaggi(data || [])
    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    setSending(true)
    const { error } = await supabase.from('comunicazioni').insert({
      condominio_id: condominio.id,
      mittente_id: user.id,
      destinatario_id: null, // all'amministratore
      oggetto: form.oggetto,
      messaggio: form.messaggio,
    })
    setSending(false)
    if (!error) {
      setShowForm(false)
      setForm({ oggetto: '', messaggio: '' })
      load()
    } else {
      alert('Errore invio')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Messaggi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Send size={16} /> Nuovo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Scrivi all'amministratore</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Oggetto</label>
                <input
                  required
                  value={form.oggetto}
                  onChange={(e) => setForm({ ...form, oggetto: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Messaggio</label>
                <textarea
                  required
                  rows={5}
                  value={form.messaggio}
                  onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {sending ? 'Invio...' : 'Invia messaggio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : messaggi.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <MessageSquare className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun messaggio</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messaggi.map((m) => {
            const isMine = m.mittente_id === user.id
            return (
              <div
                key={m.id}
                className={`rounded-xl p-4 border ${isMine ? 'bg-teal-50 border-teal-100' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-800">{m.oggetto || 'Senza oggetto'}</h3>
                  <span className="text-xs text-slate-400 shrink-0">
                    {format(new Date(m.created_at), 'd MMM HH:mm', { locale: it })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{m.messaggio}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {isMine ? 'Inviato da te' : 'Dall\'amministratore'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
