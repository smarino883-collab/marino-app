import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  Calendar,
  FileText,
  LogOut,
  Building2,
  Wrench,
  Users,
  ClipboardList,
  Menu,
  X,
  Shield,
  Settings,
  Bell,
} from 'lucide-react'
import { useState } from 'react'
import PushPrompt from './PushPrompt'
import InstallPrompt from './InstallPrompt'

export default function Layout() {
  const { profile, condominio, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isAdmin = profile && profile.type === 'admin'
  const isFornitore = profile && profile.type === 'fornitore'
  const isCondomino = profile && profile.type === 'condomino'

  const navItems = []

  if (isCondomino) {
    navItems.push(
      { to: '/app', icon: Home, label: 'Home' },
      { to: '/app/calendario', icon: Calendar, label: 'Calendario' },
      { to: '/app/documenti', icon: FileText, label: 'Documenti' },
      { to: '/app/convocazioni', icon: ClipboardList, label: 'Convocazioni' },
      { to: '/app/interventi', icon: Wrench, label: 'Interventi' }
    )
  }

  if (isFornitore) {
    navItems.push(
      { to: '/fornitore', icon: Home, label: 'Dashboard' },
      { to: '/fornitore/interventi', icon: Wrench, label: 'Interventi' },
      { to: '/fornitore/profilo', icon: Users, label: 'Profilo' }
    )
  }

  if (isAdmin) {
    navItems.push(
      { to: '/admin', icon: Home, label: 'Dashboard' },
      { to: '/admin/condomini', icon: Building2, label: 'Condomini' },
      { to: '/admin/interventi', icon: Wrench, label: 'Interventi' },
      { to: '/admin/fornitori', icon: Users, label: 'Fornitori' },
      { to: '/admin/documenti', icon: FileText, label: 'Documenti' },
      { to: '/admin/convocazioni', icon: ClipboardList, label: 'Convocazioni' },
      { to: '/admin/impostazioni', icon: Settings, label: 'Impostazioni' },
      { to: '/admin/avvisi', icon: Bell, label: 'Avvisi' }
    )
  }

  let subtitle = ''
  if (isCondomino) subtitle = (condominio && condominio.nome) || ''
  else if (isFornitore) subtitle = (profile && (profile.ragione_sociale || profile.nome)) || ''
  else if (isAdmin) subtitle = 'Pannello Amministratore'

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-[#1e3a5f] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                height: '40px',
                width: 'auto',
                maxWidth: '140px',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '4px',
                display: 'block',
                flexShrink: 0,
              }}
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight truncate">
                marinoamministrazioni.it
              </div>
              <div className="text-xs text-slate-300 truncate">{subtitle}</div>
            </div>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        <aside className="hidden md:block w-56 bg-white border-r border-slate-200 p-4 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app' || item.to === '/admin' || item.to === '/fornitore'}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ' +
                  (isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50')
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
            <a
              href="https://smarino.jimdofree.com/privacy/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <Shield size={18} />
              Privacy
            </a>
          </nav>
        </aside>

        {menuOpen ? (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-1 mt-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/app' || item.to === '/admin' || item.to === '/fornitore'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ' +
                      (isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600')
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 w-full mt-4"
                >
                  <LogOut size={18} />
                  Esci
                </button>
              </nav>
            </div>
          </div>
        ) : null}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <PushPrompt />
      <InstallPrompt />
    </div>
  )
}