import { Outlet, NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Giacenze', icon: '🧊', exact: true },
  { to: '/aggiungi', label: 'Aggiungi', icon: '➕' },
  { to: '/scarico', label: 'Scarico', icon: '📦' },
  { to: '/storico', label: 'Storico', icon: '📋' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-sky-700 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Dispensa Sagra</h1>
            <p className="text-sky-200 text-xs">Gestione giacenze freezer/frigo</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-sky-700 border-t-2 border-sky-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <span className="text-xl mb-0.5">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
