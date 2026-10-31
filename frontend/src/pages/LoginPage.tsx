import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Icon } from '../components/Icon'
import { authErrorMessage, useAuth } from '../store/auth'
import { toast } from '../store/toasts'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="page-shell py-12">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-sand-200 bg-white md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-ink p-10 text-sand-100 md:flex">
          <span className="display text-lg tracking-[0.28em] text-white">SABLE</span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sand-300">
              Members get more
            </p>
            <p className="mt-3 display text-2xl leading-snug text-white">
              Order history, saved addresses and early access to new releases.
            </p>
          </div>
          <ul className="space-y-2 text-xs text-sand-300">
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5" /> Track every order
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5" /> 30-day returns
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="h-3.5 w-3.5" /> 2-year warranty
            </li>
          </ul>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="display text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 border-t border-sand-200 pt-5 text-sm text-ink-muted">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back.')
      navigate(from ?? '/', { replace: true })
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@sable.shop')
    setPassword('Demo12345!')
    setError(null)
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-ember hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full text-center text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Use demo customer account
        </button>
      </form>
    </AuthShell>
  )
}
