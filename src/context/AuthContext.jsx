import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function makeSessionId() {
  return 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [condominio, setCondominio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsContact, setNeedsContact] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('marino_session')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setUser(data.user)
        setProfile(data.profile)
        setCondominio(data.condominio || null)
        setNeedsContact(!!data.needsContact)
      } catch (e) {
        localStorage.removeItem('marino_session')
      }
    }
    setLoading(false)
  }, [])

  function persist(session) {
    localStorage.setItem('marino_session', JSON.stringify(session))
    setUser(session.user)
    setProfile(session.profile)
    setCondominio(session.condominio || null)
    setNeedsContact(!!session.needsContact)
  }

  const loginWithCode = async (codice) => {
    const { data: condo, error } = await supabase
      .from('condomini')
      .select('*')
      .eq('codice_accesso', (codice || '').trim().replace(/\s/g, '').toUpperCase())
      .eq('attivo', true)
      .single()

    if (error || !condo) {
      return { error: 'Codice non valido o condominio non attivo' }
    }

    const sessionId = makeSessionId()
    let contatto = null
    try {
      const raw = localStorage.getItem('marino_contatto_' + condo.id)
      if (raw) contatto = JSON.parse(raw)
    } catch (_) {}

    const hasNome = !!(contatto && contatto.nome && String(contatto.nome).trim().length >= 3)

    const session = {
      user: { id: sessionId, tipo: 'condomino' },
      profile: {
        type: 'condomino',
        nome: (contatto && contatto.nome) || '',
        email: (contatto && contatto.email) || '',
        unita: (contatto && contatto.unita) || '',
        session_key: sessionId,
      },
      condominio: condo,
      needsContact: !hasNome,
    }
    persist(session)
    return { data: session }
  }

  const saveCondominoContact = async ({ nome, email, unita }) => {
    if (!condominio || !profile || profile.type !== 'condomino') {
      return { error: 'Sessione non valida' }
    }

    const nomeClean = (nome || '').trim()
    if (nomeClean.length < 3) {
      return { error: 'Inserisci nome e cognome' }
    }

    const emailClean = (email || '').trim().toLowerCase()
    if (emailClean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return { error: 'Email non valida' }
    }

    const payload = {
      nome: nomeClean,
      email: emailClean || '',
      unita: (unita || '').trim(),
    }

    try {
      localStorage.setItem('marino_contatto_' + condominio.id, JSON.stringify(payload))
      await supabase.from('condomini_contatti').insert({
        condominio_id: condominio.id,
        nome: payload.nome,
        email: payload.email || null,
        unita: payload.unita || null,
        attivo: true,
      })
    } catch (_) {}

    const session = {
      user,
      profile: { ...profile, ...payload },
      condominio,
      needsContact: false,
    }
    persist(session)
    return { data: session }
  }

  const loginFornitore = async (codice) => {
    const code = (codice || '').trim().replace(/\s/g, '').toUpperCase()
    if (!code) return { error: 'Inserisci il codice fornitore' }
    if (code.length < 4) return { error: 'Codice troppo corto' }
    if (!/^[A-Z0-9]+$/.test(code)) {
      return { error: 'Il codice puo contenere solo lettere e numeri' }
    }

    const { data: fornitore, error } = await supabase
      .from('fornitori')
      .select('*')
      .eq('codice_accesso', code)
      .eq('attivo', true)
      .maybeSingle()

    if (error) return { error: 'Errore di verifica codice. Riprova.' }
    if (!fornitore) return { error: 'Codice non valido o fornitore non attivo' }

    const session = {
      user: { id: fornitore.id, tipo: 'fornitore' },
      profile: { type: 'fornitore', ...fornitore },
      condominio: null,
      needsContact: false,
    }
    persist(session)
    return { data: session }
  }

  const loginAdmin = async (email, password) => {
    const em = (email || '').trim().toLowerCase()
    const pw = password || ''

    const bootEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
    const bootPass = import.meta.env.VITE_ADMIN_PASSWORD || ''
    if (bootEmail && bootPass && em === bootEmail && pw === bootPass) {
      const session = {
        user: { id: 'bootstrap-admin', email: em, tipo: 'admin' },
        profile: { type: 'admin', nome: 'Amministratore', email: em },
        condominio: null,
        needsContact: false,
      }
      persist(session)
      return { data: session }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: pw })
    if (error) return { error: error.message || 'Credenziali non valide' }

    const { data: admin } = await supabase
      .from('utenti_admin')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!admin) {
      await supabase.auth.signOut()
      return { error: 'Utente non autorizzato come amministratore' }
    }

    const session = {
      user: data.user,
      profile: { type: 'admin', ...admin },
      condominio: null,
      needsContact: false,
    }
    persist(session)
    return { data: session }
  }

  const logout = async () => {
    localStorage.removeItem('marino_session')
    try {
      await supabase.auth.signOut()
    } catch (_) {}
    setUser(null)
    setProfile(null)
    setCondominio(null)
    setNeedsContact(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        condominio,
        loading,
        needsContact,
        loginWithCode,
        loginFornitore,
        loginAdmin,
        saveCondominoContact,
        logout,
        setCondominio,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)