import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page-shell grid min-h-[60vh] place-items-center py-16">
      <div className="text-center">
        <p className="display text-7xl text-sand-300">404</p>
        <h1 className="mt-4 display text-3xl">This page has moved on</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
          The link you followed may be broken, or the page may have been removed from the
          catalog.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <Link to="/products" className="btn-outline">
            Browse products
          </Link>
        </div>
      </div>
    </div>
  )
}
