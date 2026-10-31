import { Link } from 'react-router-dom'

import { EmptyState, Spinner } from '../../components/Feedback'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import type { Stats } from '../../types'

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: 'trend' | 'receipt' | 'users' | 'box'
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {label}
        </p>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sand-100 text-ink-soft">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-medium tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

export function AdminDashboard() {
  const { data, loading, error } = useAsync(
    (signal) => api.get<Stats>('/admin/stats/', { signal }),
    [],
  )

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-6 w-6 text-ink-muted" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="alert"
        title="Dashboard unavailable"
        description={error ?? 'Could not load store statistics.'}
      />
    )
  }

  const peak = Math.max(...data.sales_series.map((point) => point.revenue), 1)
  const statusPeak = Math.max(...data.status_breakdown.map((row) => row.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everything happening across the store right now.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products" className="btn-outline btn-sm">
            Manage products
          </Link>
          <Link to="/admin/orders" className="btn-primary btn-sm">
            View orders
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(data.revenue_total)}
          hint={`${formatCurrency(data.revenue_30d)} in the last 30 days`}
          icon="trend"
        />
        <StatCard
          label="Orders"
          value={String(data.orders_total)}
          hint={`${data.orders_open} open`}
          icon="receipt"
        />
        <StatCard
          label="Avg. order value"
          value={formatCurrency(data.average_order_value)}
          hint={`${data.customers_total} customers`}
          icon="users"
        />
        <StatCard
          label="Catalog"
          value={String(data.products_total)}
          hint={`${data.low_stock_count} low on stock`}
          icon="box"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Revenue chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Revenue · last 14 days
            </h2>
            <span className="text-xs text-ink-faint">Peak {formatCurrency(peak)}</span>
          </div>

          <div className="mt-6 flex h-40 items-end gap-1.5">
            {data.sales_series.map((point) => {
              const height = point.revenue > 0 ? Math.max(4, (point.revenue / peak) * 100) : 2
              return (
                <div
                  key={point.date}
                  className="group relative flex-1"
                  title={`${point.date}: ${formatCurrency(point.revenue)} (${point.orders} orders)`}
                >
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      point.revenue > 0 ? 'bg-ink/80 group-hover:bg-ember' : 'bg-sand-200'
                    }`}
                    style={{ height: `${height}%`, minHeight: 3 }}
                  />
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
            <span>{formatDate(data.sales_series[0]?.date)}</span>
            <span>{formatDate(data.sales_series[data.sales_series.length - 1]?.date)}</span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Orders by status
          </h2>
          <ul className="mt-4 space-y-3">
            {data.status_breakdown.map((row) => (
              <li key={row.status}>
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-ink-soft">{row.label}</span>
                  <span className="tabular-nums text-ink-muted">{row.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-150">
                  <div
                    className="h-full rounded-full bg-ink/70"
                    style={{ width: `${(row.count / statusPeak) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-sand-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Recent orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-ember hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-sand-200">
              {data.recent_orders.map((order) => (
                <tr key={order.number} className="hover:bg-sand-50/60">
                  <td className="px-5 py-3">
                    <Link
                      to={`/admin/orders?q=${order.number}`}
                      className="font-mono text-xs font-medium hover:text-ember"
                    >
                      {order.number}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {order.customer_name ?? order.email}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={order.status} label={order.status_label} />
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-ink-muted">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low stock + top products */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Low stock
            </h2>
            {data.low_stock.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Everything is well stocked.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {data.low_stock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink-soft">{product.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                        product.stock === 0
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Top sellers
            </h2>
            <ol className="mt-3 space-y-2.5">
              {data.top_products.map((product, index) => (
                <li key={product.slug} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sand-100 text-[10px] font-semibold text-ink-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                    {formatCurrency(product.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
