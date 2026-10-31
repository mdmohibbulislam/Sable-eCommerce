import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState, Spinner } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { StatusBadge } from '../components/StatusBadge'
import { useAsync } from '../hooks/useAsync'
import { api, errorMessage } from '../lib/api'
import { formatCurrency, formatDateTime } from '../lib/format'
import { toast } from '../store/toasts'
import { ORDER_STATUS_FLOW, type Order } from '../types'

const STEP_LABELS: Record<string, string> = {
  pending: 'Order placed',
  paid: 'Payment confirmed',
  processing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

export function OrderDetailPage() {
  const { number = '' } = useParams()
  const [cancelling, setCancelling] = useState(false)

  const { data: order, loading, error, reload } = useAsync(
    (signal) => api.get<Order>(`/orders/${number}/`, { signal }),
    [number],
  )

  if (loading) {
    return (
      <div className="page-shell grid min-h-[50vh] place-items-center">
        <Spinner className="h-6 w-6 text-ink-muted" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon="alert"
          title="Order not found"
          description={error ?? 'We could not find an order with that number.'}
          action={
            <Link to="/orders" className="btn-primary btn-sm">
              Back to orders
            </Link>
          }
        />
      </div>
    )
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const cancellable = ['pending', 'paid', 'processing'].includes(order.status)

  const cancelOrder = async () => {
    setCancelling(true)
    try {
      await api.post<Order>(`/orders/${order.number}/cancel/`)
      toast.success('Order cancelled and refunded to the original method.')
      reload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="page-shell py-10">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <Icon name="chevronLeft" className="h-4 w-4" /> All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-3xl">{order.number}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed {formatDateTime(order.created_at)} · {order.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} label={order.status_label} />
          {cancellable && (
            <button
              type="button"
              onClick={cancelOrder}
              disabled={cancelling}
              className="btn-outline btn-sm"
            >
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {isCancelled ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
          This order was cancelled. Any payment has been refunded and stock returned to
          the shelf.
        </div>
      ) : (
        <ol className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          {ORDER_STATUS_FLOW.map((status, index) => {
            const done = index <= currentStep
            return (
              <li key={status} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    done ? 'bg-ink text-sand-50' : 'bg-sand-150 text-ink-faint'
                  }`}
                >
                  {done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /> : index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-xs ${
                    done ? 'font-medium text-ink' : 'text-ink-faint'
                  }`}
                >
                  {STEP_LABELS[status]}
                </span>
                {index < ORDER_STATUS_FLOW.length - 1 && (
                  <span
                    className={`h-px flex-1 ${done ? 'bg-ink/30' : 'bg-sand-200'}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="card overflow-hidden">
          <div className="border-b border-sand-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Items
            </h2>
          </div>
          <ul className="divide-y divide-sand-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  {item.product_slug ? (
                    <Link
                      to={`/products/${item.product_slug}`}
                      className="text-sm font-medium hover:text-ember"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{item.product_name}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(item.line_total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Summary
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="tabular-nums">
                  {order.shipping_cost === 0 ? 'Free' : formatCurrency(order.shipping_cost)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="tabular-nums">{formatCurrency(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-2.5 text-xs text-ink-soft">
              <Icon name="creditCard" className="h-4 w-4 shrink-0" />
              {order.payment_method === 'cod'
                ? 'Cash on delivery'
                : `Card ···· ${order.payment_reference.slice(-4) || '0000'}`}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Shipping to
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
              <span className="block font-medium text-ink">
                {order.shipping_address.full_name}
              </span>
              {order.shipping_address.line1}
              {order.shipping_address.line2 && (
                <>
                  <br />
                  {order.shipping_address.line2}
                </>
              )}
              <br />
              {order.shipping_address.city}
              {order.shipping_address.state && `, ${order.shipping_address.state}`}{' '}
              {order.shipping_address.postal_code}
              <br />
              {order.shipping_address.country}
              {order.shipping_address.phone && (
                <>
                  <br />
                  <span className="text-ink-muted">{order.shipping_address.phone}</span>
                </>
              )}
            </address>
          </div>

          {order.notes && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Notes
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{order.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
