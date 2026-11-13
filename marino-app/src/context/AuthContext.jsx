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
      .eq('codice_accesso', codice.trim().replace(/\s/g, '').toUpperCase())
      .eq('attivo', true)
      .single()

    if (error || !condo) {
      return { error: 'Codice non valido o condominio non attivo' }
    }

    const sessionId = makeSessionId()
    // recupera contatto salvato in passato su questo browser per lo stesso condominio
    let contatto = null
    try {
      const key = `marino_contatto_${condo.id}`
      const raw = localStorage.getItem(key)
      if (raw) contatto = JSON.parse(raw)
    } catch (_) {}

    // se ha un'email salvata, verifica che non sia stata revocata
    if (contatto?.email) {
      try {
        const { data: rows } = await supabase
          .from('condomini_contatti')
          .select('id, attivo')
          .eq('condominio_id', condo.id)
          .eq('email', contatto.email.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(5)
        const blocked = (rows || []).some((r) => r.attivo === false)
        const anyActive = (rows || []).some((r) => r.attivo !== false)
        if (blocked && !anyActive) {
          localStorage.removeItem(`marino_contatto_${condo.id}`)
          return { error: 'Accesso revocato per questo contatto. Contatta l\'amministratore.' }
        }
      } catch (_) {}
    }

    const hasEmail = !!(contatto?.email)
    const session = {
      user: { id: sessionId, tipo: 'condomino' },
      profile: {
        type: 'condomino',
        nome: contatto?.nome || '',
        email: contatto?.email || '',
        unita: contatto?.unita || '',
        session_key: sessionId,
      },
      condominio: condo,
      needsContact: !hasEmail,
    }

    persist(session)
    return { data: session }
  }

  const saveCondominoContact = async ({ nome, email, unita, skip }) => {
    if (!condominio || profile?.type !== 'condomino') {
      return { error: 'Sessione non valida' }
    }

    if (skip) {
      const session = {
        user,
        profile: { ...profile },
        condominio,
        needsContact: false,
      }
      persist(session)
      localStorage.setItem(`marino_contatto_skip_${condominio.id}`, '1')
      return { data: session }
    }

    const emailClean = (email || '').trim().toLowerCase()
    if (emailClean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return { error: 'Email non valida' }
    }

    if (emailClean) {
      try {
        const { data: rows } = await supabase
          .from('condomini_contatti')
          .select('id, attivo')
          .eq('condominio_id', condominio.id)
          .eq('email', emailClean)
          .order('created_at', { ascending: false })
          .limit(5)
        const blocked = (rows || []).some((r) => r.attivo === false)
        const anyActive = (rows || []).some((r) => r.attivo !== false)
        if (blocked && !anyActive) {
          return { error: 'Questa email risulta revocata. Contatta l\'amministratore.' }
        }
      } catch (_) {}
    }

    const payload = {
      condominio_id: condominio.id,
      session_key: user?.id || profile?.session_key,
      nome: (nome || '').trim() || null,
      email: emailClean || null,
      unita: (unita || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    try {
      await supabase.from('condomini_contatti').insert(payload)
    } catch (_) {
      // tabella assente: continua solo in locale
    }

    localStorage.setItem(
      `marino_contatto_${condominio.id}`,
      JSON.stringify({ nome: payload.nome, email: payload.email, unita: payload.unita })
    )

    const session = {
      user,
      profile: {
        ...profile,
        nome: payload.nome || profile.nome,
        email: payload.email || '',
        unita: payload.unita || '',
      },
      condominio,
      needsContact: false,
    }
    persist(session)
    return { data: session }
  }

  const loginFornitore = async (email, password) => {
    const { data: fornitore, error } = await supabase
      .from('fornitori')
      .select('*')
      .eq('email', email.trim())
      .eq('attivo', true)
      .single()

    if (error || !fornitore) {
      return { error: 'Credenziali non valide' }
    }

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

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
    await supabase.auth.signOut()
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
