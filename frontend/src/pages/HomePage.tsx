import { Link } from 'react-router-dom'

import { ProductGridSkeleton, Spinner } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { ProductCard } from '../components/ProductCard'
import { useAsync } from '../hooks/useAsync'
import { useCategories } from '../hooks/useCatalog'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import type { Paginated, Product } from '../types'

const VALUE_PROPS = [
  { icon: 'truck', title: 'Free shipping over $75', copy: 'Carbon-neutral, 2–4 days' },
  { icon: 'refresh', title: '30-day returns', copy: 'No questions asked' },
  { icon: 'shield', title: '2-year warranty', copy: 'On electronics' },
  { icon: 'lock', title: 'Secure checkout', copy: 'Demo — no real charges' },
] as const

export function HomePage() {
  const { categories } = useCategories()

  const featured = useAsync(
    (signal) => api.get<Product[]>('/products/featured/?limit=8', { signal }),
    [],
  )
  const newest = useAsync(
    (signal) =>
      api.get<Paginated<Product>>('/products/?ordering=-created_at&page_size=4', {
        signal,
      }),
    [],
  )

  const hero = featured.data?.[0]

  return (
    <div>
      {/* Hero */}
      <section className="page-shell pt-10 pb-14 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <p className="eyebrow">Autumn collection 2026</p>
            <h1 className="mt-4 display text-[2.75rem] leading-[1.05] text-ink sm:text-6xl">
              Considered goods
              <br />
              for everyday life.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
              Audio, wearables and objects for the home — chosen for how they feel after
              a year, not how they look on day one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/products" className="btn-primary">
                Shop the collection
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link to="/products?on_sale=true" className="btn-outline">
                View sale
              </Link>
            </div>
            <dl className="mt-10 flex gap-8 border-t border-sand-200 pt-6 text-sm">
              <div>
                <dt className="text-ink-faint">Products</dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums">
                  {categories.reduce((sum, item) => sum + item.product_count, 0) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Categories</dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums">
                  {categories.length || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Shipping</dt>
                <dd className="mt-0.5 text-lg font-medium">2–4 days</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            {featured.loading && (
              <div className="aspect-[4/5] animate-pulse rounded-3xl bg-sand-150" />
            )}
            {hero && (
              <Link
                to={`/products/${hero.slug}`}
                className="group block overflow-hidden rounded-3xl bg-sand-150 shadow-card"
              >
                <img
                  src={hero.image_url}
                  alt={hero.name}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Featured
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-ink">{hero.name}</p>
                    <p className="text-sm tabular-nums text-ember">
                      {formatCurrency(hero.price)}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sand-50">
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-sand-200 bg-white">
        <div className="page-shell grid grid-cols-2 gap-6 py-6 lg:grid-cols-4">
          {VALUE_PROPS.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand-100 text-ink-soft">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="truncate text-xs text-ink-muted">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="page-shell py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 className="mt-2 display text-3xl">Shop by category</h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink sm:flex"
          >
            All products <Icon name="chevronRight" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-sand-200 p-4 transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(150deg, ${category.accent}1f, ${category.accent}08)`,
              }}
            >
              <span
                className="mb-8 block h-2 w-2 rounded-full"
                style={{ background: category.accent }}
              />
              <p className="text-sm font-medium text-ink">{category.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {category.product_count} items
              </p>
              <Icon
                name="arrowRight"
                className="absolute right-3 top-3 h-4 w-4 -translate-x-1 text-ink/30 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="page-shell pb-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Curated</p>
            <h2 className="mt-2 display text-3xl">Featured this week</h2>
          </div>
          <Link
            to="/products?featured=true"
            className="flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            View all <Icon name="chevronRight" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-7">
          {featured.loading ? (
            <ProductGridSkeleton count={4} />
          ) : featured.error ? (
            <p className="text-sm text-ink-muted">{featured.error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {(featured.data ?? []).slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="page-shell pb-14">
        <div className="overflow-hidden rounded-3xl bg-ink text-sand-100">
          <div className="grid items-center gap-0 md:grid-cols-2">
            <div className="p-8 sm:p-12">
              <p className="text-[11px] uppercase tracking-[0.2em] text-sand-300">
                The long view
              </p>
              <h2 className="mt-4 display text-3xl leading-tight text-white">
                Buy fewer things.
                <br />
                Keep them longer.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-200">
                Every product earns its place with a repairable design, replaceable
                parts and a two-year warranty. If it breaks, we fix it.
              </p>
              <Link
                to="/products?on_sale=true"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-sand-50 px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-white"
              >
                Shop the sale
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative min-h-64 md:min-h-full">
              {newest.data?.results?.[0] && (
                <img
                  src={newest.data.results[0].image_url}
                  alt={newest.data.results[0].name}
                  className="h-full w-full object-cover opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="page-shell pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Just landed</p>
            <h2 className="mt-2 display text-3xl">New arrivals</h2>
          </div>
          <Link
            to="/products?ordering=-created_at"
            className="flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            View all <Icon name="chevronRight" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-7">
          {newest.loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {(newest.data?.results ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export function HomePageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="h-6 w-6 text-ink-muted" />
    </div>
  )
}
