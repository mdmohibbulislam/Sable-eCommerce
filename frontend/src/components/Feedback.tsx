import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon = 'package',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sand-200 bg-white/60 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-sand-100 text-ink-muted">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="display text-lg text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-sand-150" />
          <div className="mt-3 h-3 w-16 rounded bg-sand-150" />
          <div className="mt-2 h-4 w-3/4 rounded bg-sand-150" />
          <div className="mt-2 h-4 w-20 rounded bg-sand-150" />
        </div>
      ))}
    </div>
  )
}
