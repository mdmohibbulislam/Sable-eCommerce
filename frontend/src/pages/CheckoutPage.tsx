import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { useAsync } from '../hooks/useAsync'
import { api, errorMessage } from '../lib/api'
import { formatCurrency } from '../lib/format'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { toast } from '../store/toasts'
import type { Order, Quote } from '../types'

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany']

export function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  })
  const [payment, setPayment] = useState<'card' | 'cod'>('card')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<Order | null>(null)

  const signature = items.map((item) => `${item.productId}x${item.quantity}`).join(',')

  const quote = useAsync(
    async (signal) => {
      if (items.length === 0) return null
      return api.post<Quote>(
        '/orders/quote/',
        {
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        },
        { auth: false, signal },
      )
    },
    [signature],
  )

  if (items.length === 0 && !placed) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon="cart"
          title="Nothing to check out"
          description="Your cart is empty. Add a product first."
          action={
            <Link to="/products" className="btn-primary btn-sm">
              Browse products
            </Link>
          }
        />
      </div>
    )
  }

  if (placed) {
    return (
      <div className="page-shell py-20">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-6 display text-3xl">Thank you, {user?.first_name || 'friend'}.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Order <strong className="text-ink">{placed.number}</strong> is confirmed. A
            receipt has been sent to {placed.email}.
          </p>

          <div className="card mt-8 divide-y divide-sand-200 text-left">
            {placed.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product_name}</p>
                  <p className="text-xs text-ink-muted">
                    Qty {item.quantity} · {formatCurrency(item.line_total)}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 text-sm font-semibold">
              <span>Total paid</span>
              <span className="tabular-nums">{formatCurrency(placed.total)}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/orders/${placed.number}`} className="btn-primary">
              View order
            </Link>
            <Link to="/products" className="btn-outline">
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const order = await api.post<Order>('/orders/', {
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        shipping: form,
        payment_method: payment,
        notes,
      })
      clear()
      setPlaced(order)
      toast.success('Order placed successfully.')
      window.scrollTo({ top: 0 })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell py-10">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <Icon name="chevronLeft" className="h-4 w-4" /> Back to cart
      </button>

      <h1 className="mt-4 display text-4xl">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-sand-50">
                1
              </span>
              Contact
            </h2>
            <div className="mt-4 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm">
              <p className="text-ink">{user?.email}</p>
              <Link to="/login" className="mt-1 inline-block text-xs text-ember hover:underline">
                Not you? Sign in with another account
              </Link>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-sand-50">
                2
              </span>
              Shipping address
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="full_name">
                  Full name
                </label>
                <input
                  id="full_name"
                  required
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                  className="field"
                  placeholder="Devon Marlowe"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="line1">
                  Address
                </label>
                <input
                  id="line1"
                  required
                  value={form.line1}
                  onChange={(event) => update('line1', event.target.value)}
                  className="field"
                  placeholder="214 Maple Avenue"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="line2">
                  Apartment, suite (optional)
                </label>
                <input
                  id="line2"
                  value={form.line2}
                  onChange={(event) => update('line2', event.target.value)}
                  className="field"
                  placeholder="Apt 5"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  required
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  className="field"
                  placeholder="Portland"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="state">
                  State / region
                </label>
                <input
                  id="state"
                  value={form.state}
                  onChange={(event) => update('state', event.target.value)}
                  className="field"
                  placeholder="OR"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="postal_code">
                  Postal code
                </label>
                <input
                  id="postal_code"
                  required
                  value={form.postal_code}
                  onChange={(event) => update('postal_code', event.target.value)}
                  className="field"
                  placeholder="97209"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  className="field"
                  placeholder="+1 555 0142"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="country">
                  Country
                </label>
                <select
                  id="country"
                  value={form.country}
                  onChange={(event) => update('country', event.target.value)}
                  className="field"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-sand-50">
                3
              </span>
              Payment
            </h2>

            <div className="mt-4 space-y-2.5">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  payment === 'card' ? 'border-ink bg-white' : 'border-sand-200 bg-white/60'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={payment === 'card'}
                  onChange={() => setPayment('card')}
                  className="mt-0.5 h-4 w-4 text-ember focus:ring-ember/30"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="creditCard" className="h-4 w-4" /> Card
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Demo gateway — any details work, nothing is charged.
                  </span>
                </span>
              </label>

              {payment === 'card' && (
                <div className="ml-7 grid gap-3 rounded-xl bg-sand-100/70 p-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="field-label" htmlFor="card_number">
                      Card number
                    </label>
                    <input
                      id="card_number"
                      defaultValue="4242 4242 4242 4242"
                      inputMode="numeric"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="card_expiry">
                      Expiry
                    </label>
                    <input id="card_expiry" defaultValue="12/28" className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="card_cvc">
                      CVC
                    </label>
                    <input id="card_cvc" defaultValue="123" className="field" />
                  </div>
                </div>
              )}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  payment === 'cod' ? 'border-ink bg-white' : 'border-sand-200 bg-white/60'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={payment === 'cod'}
                  onChange={() => setPayment('cod')}
                  className="mt-0.5 h-4 w-4 text-ember focus:ring-ember/30"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon name="package" className="h-4 w-4" /> Cash on delivery
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Pay when the courier arrives. Order stays pending until then.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section>
            <label className="field-label" htmlFor="notes">
              Order notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={500}
              className="field resize-none"
              placeholder="Delivery instructions, gift note…"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Order summary
            </h2>

            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="text-[11px] text-ink-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="text-xs tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {quote.data && (
              <dl className="mt-5 space-y-2 border-t border-sand-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(quote.data.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Shipping</dt>
                  <dd className="tabular-nums">
                    {quote.data.shipping_cost === 0
                      ? 'Free'
                      : formatCurrency(quote.data.shipping_cost)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Tax</dt>
                  <dd className="tabular-nums">{formatCurrency(quote.data.tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(quote.data.total)}</dd>
                </div>
              </dl>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-accent mt-5 w-full">
              {submitting ? 'Placing order…' : 'Place order'}
              {!submitting && <Icon name="arrowRight" className="h-4 w-4" />}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
              <Icon name="lock" className="h-3.5 w-3.5" />
              No real payment is processed
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
