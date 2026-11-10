import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Building2, Plus, X, Copy, Check, Key, Users, Ban, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

function generaCodice() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function AdminCondomini() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState(null)
  const [contattiOpen, setContattiOpen] = useState(null) // condominio id
  const [contatti, setContatti] = useState([])
  const [loadingContatti, setLoadingContatti] = useState(false)
  const [form, setForm] = useState({
    nome: '', indirizzo: '', citta: '', cap: '', codice_fiscale: '', codice_accesso: generaCodice(),
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('condomini').select('*').order('nome')
    setLista(data || [])
    setLoading(false)
  }

  async function loadContatti(condoId) {
    setContattiOpen(condoId)
    setLoadingContatti(true)
    const { data } = await supabase
      .from('condomini_contatti')
      .select('*')
      .eq('condominio_id', condoId)
      .order('created_at', { ascending: false })
    setContatti(data || [])
    setLoadingContatti(false)
  }

  async function revocaContatto(id) {
    if (!confirm('Revocare l\'accesso a questo condomino? Non potrà più entrare con questa email.')) return
    await supabase
      .from('condomini_contatti')
      .update({
        attivo: false,
        revocato_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (contattiOpen) loadContatti(contattiOpen)
  }

  async function ripristinaContatto(id) {
    await supabase
      .from('condomini_contatti')
      .update({
        attivo: true,
        revocato_at: null,
        note_revoca: null,
      })
      .eq('id', id)
    if (contattiOpen) loadContatti(contattiOpen)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const { error } = await supabase.from('condomini').insert(form)
    if (!error) {
      setShowForm(false)
      setForm({ nome: '', indirizzo: '', citta: '', cap: '', codice_fiscale: '', codice_accesso: generaCodice() })
      load()
    } else {
      alert('Errore: ' + error.message)
    }
  }

  async function toggleAttivo(id, attuale) {
    await supabase.from('condomini').update({ attivo: !attuale }).eq('id', id)
    load()
  }

  async function resetCodice(id) {
    if (!confirm('Generare un nuovo codice? Il codice precedente non sarà più valido per nessuno.')) return
    const nuovo = generaCodice()
    await supabase.from('condomini').update({ codice_accesso: nuovo }).eq('id', id)
    load()
  }

  function copia(codice, id) {
    navigator.clipboard.writeText(codice)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Condomini</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Nuovo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Nuovo condominio</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Es. Condominio Via Roma 12" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Indirizzo</label>
                <input value={form.indirizzo} onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Città</label>
                  <input value={form.citta} onChange={(e) => setForm({ ...form, citta: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CAP</label>
                  <input value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Codice fiscale condominio</label>
                <input value={form.codice_fiscale} onChange={(e) => setForm({ ...form, codice_fiscale: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Codice di accesso *</label>
                <div className="flex gap-2">
                  <input required value={form.codice_accesso}
                    onChange={(e) => setForm({ ...form, codice_accesso: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-widest text-center" />
                  <button type="button" onClick={() => setForm({ ...form, codice_accesso: generaCodice() })}
                    className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">
                    Genera
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Codice alfanumerico da dare ai condomini</p>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700">
                Crea condominio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pannello contatti / revoche */}
      {contattiOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users size={18} /> Condomini registrati
              </h2>
              <button onClick={() => setContattiOpen(null)}><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Elenco di chi ha lasciato nome/email. La revoca blocca l’accesso con quella email.
              Chi usa solo il codice condiviso non compare qui: in quel caso cambia il codice del condominio.
            </p>
            {loadingContatti ? (
              <div className="text-center py-6 text-slate-400 text-sm">Caricamento...</div>
            ) : contatti.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Nessun contatto salvato. Compariranno quando un condomino inserisce l’email.
              </div>
            ) : (
              <div className="space-y-2">
                {contatti.map((c) => (
                  <div key={c.id} className={'rounded-xl border p-3 ' + (c.attivo === false ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm text-slate-800">
                          {c.nome || 'Senza nome'}
                          {c.unita ? ` · ${c.unita}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">{c.email || 'Nessuna email'}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {c.created_at && format(new Date(c.created_at), 'd MMM yyyy', { locale: it })}
                          {c.attivo === false && c.revocato_at && (
                            <> · Revocato il {format(new Date(c.revocato_at), 'd MMM yyyy', { locale: it })}</>
                          )}
                        </div>
                      </div>
                      <span className={'text-xs px-2 py-0.5 rounded-full shrink-0 ' + (c.attivo === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                        {c.attivo === false ? 'Revocato' : 'Attivo'}
                      </span>
                    </div>
                    <div className="mt-2">
                      {c.attivo === false ? (
                        <button
                          onClick={() => ripristinaContatto(c.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-slate-50"
                        >
                          <RotateCcw size={12} /> Ripristina accesso
                        </button>
                      ) : (
                        <button
                          onClick={() => revocaContatto(c.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Ban size={12} /> Revoca accesso
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400">Caricamento...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <Building2 className="mx-auto mb-2 opacity-40" size={32} />
          <p>Nessun condominio. Creane uno per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-800">{c.nome}</h3>
                  <p className="text-sm text-slate-500">{c.indirizzo}{c.citta ? `, ${c.citta}` : ''}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.attivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.attivo ? 'Attivo' : 'Disattivo'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Key size={14} className="text-slate-400" />
                <code className="font-mono text-sm tracking-widest flex-1">{c.codice_accesso}</code>
                <button onClick={() => copia(c.codice_accesso, c.id)} className="p-1 hover:bg-slate-200 rounded">
                  {copied === c.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => loadContatti(c.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">
                  <Users size={12} /> Contatti / Revoche
                </button>
                <button onClick={() => resetCodice(c.id)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                  Nuovo codice
                </button>
                <button onClick={() => toggleAttivo(c.id, c.attivo)} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                  {c.attivo ? 'Disattiva' : 'Attiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
