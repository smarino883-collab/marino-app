import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Privacy from './pages/Privacy'

// Condomino
import Home from './pages/condomino/Home'
import Segnalazioni from './pages/condomino/Segnalazioni'
import Calendario from './pages/condomino/Calendario'
import Documenti from './pages/condomino/Documenti'
import Convocazioni from './pages/condomino/Convocazioni'
import Comunicazioni from './pages/condomino/Comunicazioni'
import CompletaProfilo from './pages/condomino/CompletaProfilo'

// Fornitore
import InterventiFornitore from './pages/fornitore/Interventi'
import FornitoreDashboard from './pages/fornitore/Dashboard'
import FornitoreProfilo from './pages/fornitore/Profilo'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminInterventi from './pages/admin/Interventi'
import AdminCondomini from './pages/admin/Condomini'
import AdminFornitori from './pages/admin/Fornitori'
import AdminDocumenti from './pages/admin/Documenti'
import AdminConvocazioni from './pages/admin/Convocazioni'
import AdminImpostazioni from './pages/admin/Impostazioni'
import AdminAvvisi from './pages/admin/Avvisi'

function PrivateRoute({ children, allowed }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Caricamento...</div>
  if (!user) return <Navigate to="/" replace />
  if (allowed && !allowed.includes(profile?.type)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="/app/completa-profilo" element={
        <PrivateRoute allowed={['condomino']}>
          <CompletaProfilo />
        </PrivateRoute>
      } />

      {/* Area Condomino */}
      <Route path="/app" element={
        <PrivateRoute allowed={['condomino']}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Home />} />
        <Route path="segnalazioni" element={<Segnalazioni />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="documenti" element={<Documenti />} />
        <Route path="convocazioni" element={<Convocazioni />} />
        <Route path="comunicazioni" element={<Comunicazioni />} />
      </Route>

      {/* Area Fornitore */}
      <Route path="/fornitore" element={
        <PrivateRoute allowed={['fornitore']}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<FornitoreDashboard />} />
        <Route path="interventi" element={<InterventiFornitore />} />
        <Route path="profilo" element={<FornitoreProfilo />} />
      </Route>

      {/* Area Admin */}
      <Route path="/admin" element={
        <PrivateRoute allowed={['admin']}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="interventi" element={<AdminInterventi />} />
        <Route path="condomini" element={<AdminCondomini />} />
        <Route path="fornitori" element={<AdminFornitori />} />
        <Route path="documenti" element={<AdminDocumenti />} />
        <Route path="convocazioni" element={<AdminConvocazioni />} />
        <Route path="impostazioni" element={<AdminImpostazioni />} />
	<Route path="avvisi" element={<AdminAvvisi />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
