import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, Spinner } from '../../components/Feedback'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { StatusBadge } from '../../components/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { api, errorMessage, query } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import { toast } from '../../store/toasts'
import type { Order, OrderStatus, Paginated } from '../../types'

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AdminOrders() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [busyNumber, setBusyNumber] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const list = useAsync(
    (signal) =>
      api.get<Paginated<Order>>(
        `/admin/orders/${query({ status, search: debounced, page, page_size: 20 })}`,
        { signal },
      ),
    [status, debounced, page],
  )

  const changeStatus = async (order: Order, next: OrderStatus) => {
    if (next === order.status) return
    setBusyNumber(order.number)
    try {
      await api.patch(`/admin/orders/${order.number}/`, { status: next })
      toast.success(`${order.number} marked ${next}.`)
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusyNumber(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {list.data?.count ?? 0} orders · update status as orders move
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, email or name"
            className="field pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStatus('')
              setPage(1)
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
              status === '' ? 'bg-ink text-sand-50' : 'bg-white text-ink-muted hover:bg-sand-100'
            }`}
          >
            All
          </button>
          {STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatus(option.value)
                setPage(1)
              }}
              className={`rounded-full px-3 py-1.5 text-xs capitalize transition-colors ${
                status === option.value
                  ? 'bg-ink text-sand-50'
                  : 'bg-white text-ink-muted hover:bg-sand-100'
              }`}
            >
              {option.value}
            </button>
          ))}
        </div>
      </div>

      {list.loading ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-6 w-6 text-ink-muted" />
        </div>
      ) : list.error ? (
        <EmptyState icon="alert" title="Could not load orders" description={list.error} />
      ) : (list.data?.results.length ?? 0) === 0 ? (
        <EmptyState icon="receipt" title="No orders match" description="Try another filter." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-sand-200 bg-sand-50/70 text-left text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Placed</th>
                  <th className="px-4 py-3 text-right font-semibold">Items</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {list.data?.results.map((order) => (
                  <tr key={order.number} className="hover:bg-sand-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.number}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{order.customer_name ?? order.email}</p>
                      <p className="text-[11px] text-ink-muted">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{order.item_count}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          disabled={busyNumber === order.number}
                          onChange={(event) =>
                            changeStatus(order, event.target.value as OrderStatus)
                          }
                          className="rounded-lg border border-sand-200 bg-white px-2 py-1 text-[11px] focus:border-ember focus:outline-none"
                          aria-label={`Update status for ${order.number}`}
                        >
                          {STATUSES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/orders/${order.number}`}
                        className="text-xs text-ink-muted hover:text-ember"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} numPages={list.data?.num_pages ?? 1} onChange={setPage} />
    </div>
  )
}
