import { Link, useNavigate } from 'react-router-dom'

import { EmptyState, Spinner } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { QuantityStepper } from '../components/QuantityStepper'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import type { Quote } from '../types'

export function CartPage() {
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)
  const status = useAuth((state) => state.status)
  const navigate = useNavigate()

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

  if (items.length === 0) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          description="Browse the collection and add something you will still like next year."
          action={
            <Link to="/products" className="btn-primary btn-sm">
              Start shopping
            </Link>
          }
        />
      </div>
    )
  }

  const remaining = quote.data?.amount_to_free_shipping ?? 0
  const progress =
    quote.data && quote.data.free_shipping_threshold > 0
      ? Math.min(100, Math.max(0, 100 - (remaining / quote.data.free_shipping_threshold) * 100))
      : 100

  const goToCheckout = () => {
    if (status !== 'authenticated') {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="page-shell py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="display text-4xl">Your cart</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link to="/products" className="text-sm text-ink-muted hover:text-ink">
          Continue shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-sand-200 border-y border-sand-200">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 py-5">
              <Link
                to={`/products/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-150"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/products/${item.slug}`}
                      className="line-clamp-2 text-sm font-medium text-ink hover:text-ember"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted tabular-nums">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.stock}
                    onChange={(next) => setQuantity(item.productId, next)}
                    compact
                  />
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Order summary
            </h2>

            {quote.loading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
                <Spinner className="h-4 w-4" /> Pricing your cart…
              </div>
            ) : quote.error ? (
              <p className="mt-4 text-sm text-red-700">{quote.error}</p>
            ) : quote.data ? (
              <>
                <dl className="mt-5 space-y-2.5 text-sm">
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
                    <dt className="text-ink-muted">Tax (8%)</dt>
                    <dd className="tabular-nums">{formatCurrency(quote.data.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatCurrency(quote.data.total)}</dd>
                  </div>
                </dl>

                {remaining > 0 ? (
                  <div className="mt-5 rounded-xl bg-sand-100 p-3.5">
                    <p className="text-xs text-ink-soft">
                      Add <strong>{formatCurrency(remaining)}</strong> more for free shipping
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-200">
                      <div
                        className="h-full rounded-full bg-ember transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800">
                    <Icon name="truck" className="h-4 w-4" />
                    Free shipping unlocked
                  </p>
                )}
              </>
            ) : null}

            <button
              type="button"
              onClick={goToCheckout}
              disabled={items.length === 0}
              className="btn-accent mt-6 w-full"
            >
              {status === 'authenticated' ? 'Checkout' : 'Sign in to checkout'}
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
              <Icon name="lock" className="h-3.5 w-3.5" />
              Demo store — no payment is processed
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
