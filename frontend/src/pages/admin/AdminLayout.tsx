import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Icon } from '../../components/Icon'
import { Toasts } from '../../components/Toasts'
import { initials } from '../../lib/format'
import { useAuth } from '../../store/auth'

const NAV = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/products', label: 'Products', icon: 'box', end: false },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt', end: false },
] as const

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-sand-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sand-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sand-200 px-5">
          <Link to="/" className="display text-lg tracking-[0.24em]">
            SABLE
          </Link>
          <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-ink text-sand-50'
                    : 'text-ink-soft hover:bg-sand-100 hover:text-ink'
                }`
              }
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sand-200 p-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-sand-100"
          >
            <Icon name="store" className="h-4 w-4" /> View storefront
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-sand-200 bg-sand-50/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-1 lg:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-xs ${
                    isActive ? 'bg-ink text-sand-50' : 'text-ink-muted hover:bg-sand-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-ink-muted sm:block">{user?.email}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-sand-50">
              {initials(user?.full_name || user?.email || 'A')}
            </span>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="btn-ghost px-2"
              aria-label="Sign out"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Toasts />
    </div>
  )
}
