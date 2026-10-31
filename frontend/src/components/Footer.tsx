import { Link } from 'react-router-dom'

import { useCategories } from '../hooks/useCatalog'
import { Icon } from './Icon'

export function Footer() {
  const { categories } = useCategories()

  return (
    <footer className="mt-24 border-t border-sand-200 bg-white">
      <div className="page-shell py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="display text-lg tracking-[0.28em]">SABLE</p>
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
              Considered goods for everyday life. Small batches, honest materials and a
              two-year warranty on everything with a battery.
            </p>
            <div className="flex items-center gap-2 pt-1 text-ink-muted">
              <Icon name="truck" className="h-4 w-4" />
              <span className="text-xs">Ships from Portland, OR</span>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-3">Shop</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="link-quiet text-ink-soft">
                  All products
                </Link>
              </li>
              {categories.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="link-quiet text-ink-soft"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-3">Account</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/orders" className="link-quiet text-ink-soft">
                  Order history
                </Link>
              </li>
              <li>
                <Link to="/cart" className="link-quiet text-ink-soft">
                  Your cart
                </Link>
              </li>
              <li>
                <Link to="/login" className="link-quiet text-ink-soft">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="link-quiet text-ink-soft">
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-3">Help</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>Shipping &amp; delivery</li>
              <li>Returns within 30 days</li>
              <li>Warranty &amp; repairs</li>
              <li>support@sable.shop</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-sand-200 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sable. A demonstration storefront.</p>
          <p className="flex items-center gap-1.5">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Demo checkout — no payment is processed
          </p>
        </div>
      </div>
    </footer>
  )
}
