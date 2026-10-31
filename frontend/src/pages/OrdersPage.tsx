import { Link } from 'react-router-dom'

import { EmptyState, Spinner } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { StatusBadge } from '../components/StatusBadge'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import { formatCurrency, formatDate, pluralize } from '../lib/format'
import type { Order, Paginated } from '../types'

export function OrdersPage() {
  const { data, loading, error } = useAsync(
    (signal) => api.get<Paginated<Order>>('/orders/', { signal }),
    [],
  )

  return (
    <div className="page-shell py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Your orders</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Track deliveries, review receipts and start a return.
          </p>
        </div>
        <Link to="/products" className="text-sm text-ink-muted hover:text-ink">
          Keep shopping
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner className="h-6 w-6 text-ink-muted" />
          </div>
        ) : error ? (
          <EmptyState icon="alert" title="Could not load orders" description={error} />
        ) : (data?.results.length ?? 0) === 0 ? (
          <EmptyState
            icon="receipt"
            title="No orders yet"
            description="When you place an order it will show up here with tracking and receipts."
            action={
              <Link to="/products" className="btn-primary btn-sm">
                Start shopping
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {data?.results.map((order) => (
              <li key={order.number} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 bg-sand-50/60 px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-medium">{order.number}</span>
                    <StatusBadge status={order.status} label={order.status_label} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span>Placed {formatDate(order.created_at)}</span>
                    <span className="font-medium text-ink tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 4).map((item) => (
                        <img
                          key={item.id}
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-11 w-11 rounded-lg border-2 border-white object-cover"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ink-muted">
                      {pluralize(order.item_count, 'item')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/orders/${order.number}`}
                      className="btn-outline btn-sm"
                    >
                      View details
                      <Icon name="chevronRight" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
