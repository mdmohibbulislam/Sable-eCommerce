import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { authErrorMessage, useAuth } from '../store/auth'
import { toast } from '../store/toasts'
import { AuthShell } from './LoginPage'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const register = useAuth((state) => state.register)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      toast.success('Account created. Welcome to Sable.')
      navigate(from ?? '/', { replace: true })
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="One account for orders, returns and warranty claims."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ember hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="first_name">
              First name
            </label>
            <input
              id="first_name"
              required
              value={form.first_name}
              onChange={(event) => update('first_name', event.target.value)}
              className="field"
              placeholder="Devon"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="last_name">
              Last name
            </label>
            <input
              id="last_name"
              required
              value={form.last_name}
              onChange={(event) => update('last_name', event.target.value)}
              className="field"
              placeholder="Marlowe"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="register_email">
            Email
          </label>
          <input
            id="register_email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="register_password">
            Password
          </label>
          <input
            id="register_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            className="field"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="register_confirm">
            Confirm password
          </label>
          <input
            id="register_confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password_confirm}
            onChange={(event) => update('password_confirm', event.target.value)}
            className="field"
            placeholder="Repeat password"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
