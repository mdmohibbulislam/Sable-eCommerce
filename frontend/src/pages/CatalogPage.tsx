import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState, ProductGridSkeleton } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { Pagination } from '../components/Pagination'
import { ProductCard } from '../components/ProductCard'
import { useAsync } from '../hooks/useAsync'
import { useCategories } from '../hooks/useCatalog'
import { api, query } from '../lib/api'
import type { Paginated, Product } from '../types'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A–Z' },
]

const PRICE_BANDS = [
  { label: 'Under $100', min: '', max: '100' },
  { label: '$100 – $250', min: '100', max: '250' },
  { label: '$250 – $500', min: '250', max: '500' },
  { label: '$500 and up', min: '500', max: '' },
]

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const { categories } = useCategories()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const search = params.get('search') ?? ''
  const category = params.get('category') ?? ''
  const ordering = params.get('ordering') ?? '-created_at'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const inStock = params.get('in_stock') === 'true'
  const onSale = params.get('on_sale') === 'true'
  const minPrice = params.get('min_price') ?? ''
  const maxPrice = params.get('max_price') ?? ''
  const featured = params.get('featured') === 'true'

  const products = useAsync(
    (signal) =>
      api.get<Paginated<Product>>(
        `/products/${query({
          search,
          category,
          ordering,
          page,
          in_stock: inStock ? true : undefined,
          on_sale: onSale ? true : undefined,
          min_price: minPrice,
          max_price: maxPrice,
          featured: featured ? true : undefined,
          page_size: 12,
        })}`,
        { signal },
      ),
    [search, category, ordering, page, inStock, onSale, minPrice, maxPrice, featured],
  )

  const activeCategory = useMemo(
    () => categories.find((item) => item.slug === category),
    [categories, category],
  )

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const clearAll = () => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    setParams(next, { replace: true })
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStock ? 1 : 0) +
    (onSale ? 1 : 0) +
    (featured ? 1 : 0)

  const title = activeCategory?.name ?? (search ? `Results for “${search}”` : 'All products')
  const total = products.data?.count ?? 0

  const filters = (
    <div className="space-y-7">
      <div>
        <p className="eyebrow mb-3">Category</p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => update({ category: null })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                category ? 'text-ink-soft hover:bg-sand-100' : 'bg-sand-100 font-medium text-ink'
              }`}
            >
              All categories
            </button>
          </li>
          {categories.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => update({ category: item.slug })}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  category === item.slug
                    ? 'bg-sand-100 font-medium text-ink'
                    : 'text-ink-soft hover:bg-sand-100'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: item.accent }}
                />
                <span className="flex-1 text-left">{item.name}</span>
                <span className="text-[11px] tabular-nums text-ink-faint">
                  {item.product_count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="eyebrow mb-3">Price</p>
        <ul className="space-y-1">
          {PRICE_BANDS.map((band) => {
            const active = minPrice === band.min && maxPrice === band.max
            return (
              <li key={band.label}>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      active
                        ? { min_price: null, max_price: null }
                        : { min_price: band.min || null, max_price: band.max || null },
                    )
                  }
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-sand-100 font-medium text-ink'
                      : 'text-ink-soft hover:bg-sand-100'
                  }`}
                >
                  {band.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="eyebrow mb-3">Availability</p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) =>
                update({ in_stock: event.target.checked ? 'true' : null })
              }
              className="h-4 w-4 rounded border-sand-300 text-ember focus:ring-ember/30"
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(event) =>
                update({ on_sale: event.target.checked ? 'true' : null })
              }
              className="h-4 w-4 rounded border-sand-300 text-ember focus:ring-ember/30"
            />
            On sale
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) =>
                update({ featured: event.target.checked ? 'true' : null })
              }
              className="h-4 w-4 rounded border-sand-300 text-ember focus:ring-ember/30"
            />
            Featured
          </label>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-ember underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="page-shell py-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <span className="text-ink">{activeCategory?.name ?? 'Products'}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {products.loading
              ? 'Loading products…'
              : `${total} ${total === 1 ? 'product' : 'products'}${
                  activeCategory?.tagline ? ` · ${activeCategory.tagline}` : ''
                }`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="btn-outline btn-sm lg:hidden"
          >
            <Icon name="filter" className="h-3.5 w-3.5" />
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </button>

          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={ordering}
              onChange={(event) => update({ ordering: event.target.value })}
              className="rounded-full border border-sand-200 bg-white px-3 py-2 text-xs text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 lg:hidden">
          {filters}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{filters}</div>
        </aside>

        <div>
          {products.loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.error ? (
            <EmptyState
              icon="alert"
              title="Could not load products"
              description={products.error}
              action={
                <button type="button" onClick={products.reload} className="btn-outline btn-sm">
                  Try again
                </button>
              }
            />
          ) : (products.data?.results.length ?? 0) === 0 ? (
            <EmptyState
              title="No products match those filters"
              description="Try widening the price range or clearing a filter."
              action={
                <button type="button" onClick={clearAll} className="btn-primary btn-sm">
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
                {products.data?.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                page={page}
                numPages={products.data?.num_pages ?? 1}
                onChange={(next) => update({ page: String(next) })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
