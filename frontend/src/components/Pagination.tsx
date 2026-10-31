import { Icon } from './Icon'

interface PaginationProps {
  page: number
  numPages: number
  onChange: (page: number) => void
}

function pageWindow(page: number, numPages: number): (number | 'gap')[] {
  if (numPages <= 7) {
    return Array.from({ length: numPages }, (_, index) => index + 1)
  }
  const pages = new Set<number>([1, numPages, page])
  if (page > 2) pages.add(page - 1)
  if (page < numPages - 1) pages.add(page + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  let previous = 0
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push('gap')
    result.push(value)
    previous = value
  }
  return result
}

export function Pagination({ page, numPages, onChange }: PaginationProps) {
  if (numPages <= 1) return null

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-sand-200 text-ink-muted transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-40"
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" className="h-4 w-4" />
      </button>

      {pageWindow(page, numPages).map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-full px-3 text-sm tabular-nums transition-colors ${
              entry === page
                ? 'bg-ink text-sand-50'
                : 'border border-sand-200 text-ink-muted hover:border-ink/30 hover:text-ink'
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= numPages}
        className="grid h-9 w-9 place-items-center rounded-full border border-sand-200 text-ink-muted transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-40"
        aria-label="Next page"
      >
        <Icon name="chevronRight" className="h-4 w-4" />
      </button>
    </nav>
  )
}
