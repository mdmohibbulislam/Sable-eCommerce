import type { OrderStatus } from '../types'

const STYLES: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  processing: 'border-sky-200 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  delivered: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  cancelled: 'border-stone-200 bg-stone-100 text-stone-600',
}

export function StatusBadge({
  status,
  label,
}: {
  status: OrderStatus
  label?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${
        STYLES[status] ?? STYLES.pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </span>
  )
}
