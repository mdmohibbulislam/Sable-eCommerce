import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useCategories } from '../hooks/useCatalog'
import { initials } from '../lib/format'
import { useAuth } from '../store/auth'
import { cartCount, useCart } from '../store/cart'
import { toast } from '../store/toasts'
import { Icon } from './Icon'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm transition-colors ${
    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
  }`

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, status, logout } = useAuth()
  const items = useCart((state) => state.items)
  const count = cartCount(items)
  const { categories } = useCategories()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [term, setTerm] = useState('')
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
    setCategoriesOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!accountOpen) return
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [accountOpen])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const value = term.trim()
    navigate(value ? `/products?search=${encodeURIComponent(value)}` : '/products')
    setTerm('')
    setMobileOpen(false)
  }

  const signedIn = status === 'authenticated' && user

  const searchForm = (
    <form onSubmit={submitSearch} className="relative w-full" role="search">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
      />
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search products"
        aria-label="Search products"
        className="w-full rounded-full border border-sand-200 bg-white/80 py-2 pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
      />
    </form>
  )

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-sand-100">
        <div className="page-shell flex h-9 items-center justify-center gap-3 text-[11px] tracking-wide sm:justify-between">
          <p className="hidden sm:block">Free carbon-neutral shipping over $75</p>
          <p>30-day returns · 2-year warranty on electronics</p>
          <p className="hidden sm:block">Demo store — no real payments</p>
        </div>
      </div>

      <div className="border-b border-sand-200 bg-sand-50/95 backdrop-blur">
        <div className="page-shell flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="btn-ghost -ml-2 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} className="h-5 w-5" />
          </button>

          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="display text-xl tracking-[0.28em] text-ink">SABLE</span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-ink-faint xl:inline">
              est. 2024
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
            <NavLink to="/products" className={navLinkClass} end>
              Shop all
            </NavLink>

            <div
              className="relative"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Categories
                <Icon name="chevronDown" className="h-3.5 w-3.5" />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full w-64 pt-2">
                  <div className="card p-2 shadow-lift">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/products?category=${category.slug}`}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: category.accent }}
                        />
                        {category.name}
                        <span className="ml-auto text-[11px] tabular-nums text-ink-faint">
                          {category.product_count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto hidden w-56 md:block xl:w-64">{searchForm}</div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="btn-ghost px-2.5"
                aria-label="Account menu"
                aria-expanded={accountOpen}
              >
                {signedIn ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-sand-50">
                    {initials(user.full_name || user.email)}
                  </span>
                ) : (
                  <Icon name="user" className="h-5 w-5" />
                )}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full w-60 pt-2">
                  <div className="card overflow-hidden p-1.5 shadow-lift">
                    {signedIn ? (
                      <>
                        <div className="border-b border-sand-200 px-3 py-2.5">
                          <p className="truncate text-sm font-medium">{user.full_name}</p>
                          <p className="truncate text-xs text-ink-muted">{user.email}</p>
                        </div>
                        <Link
                          to="/orders"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                        >
                          <Icon name="receipt" className="h-4 w-4" /> My orders
                        </Link>
                        {user.is_staff && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                          >
                            <Icon name="dashboard" className="h-4 w-4" /> Admin dashboard
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            logout()
                            toast.info('Signed out.')
                            navigate('/')
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                        >
                          <Icon name="logout" className="h-4 w-4" /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                        >
                          <Icon name="user" className="h-4 w-4" /> Sign in
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                        >
                          <Icon name="spark" className="h-4 w-4" /> Create account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/cart"
              className="btn-ghost relative px-2.5"
              aria-label={`Cart, ${count} items`}
            >
              <Icon name="cart" className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-sand-200 bg-sand-50 lg:hidden">
            <div className="page-shell space-y-4 py-4">
              {searchForm}

              <div className="space-y-1">
                <Link
                  to="/products"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand-100"
                >
                  Shop all
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/products?category=${category.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-sand-100"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: category.accent }}
                    />
                    {category.name}
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
                {signedIn ? (
                  <>
                    <Link to="/orders" className="btn-outline btn-sm">
                      My orders
                    </Link>
                    {user.is_staff && (
                      <Link to="/admin" className="btn-outline btn-sm">
                        Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline btn-sm">
                      Sign in
                    </Link>
                    <Link to="/register" className="btn-primary btn-sm">
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
