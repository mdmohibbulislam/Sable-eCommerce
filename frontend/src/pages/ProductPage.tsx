import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState, Spinner } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { ProductCard } from '../components/ProductCard'
import { QuantityStepper } from '../components/QuantityStepper'
import { Stars } from '../components/Stars'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'
import { useCart } from '../store/cart'
import { toast } from '../store/toasts'
import type { Product } from '../types'

const ASSURANCES = [
  { icon: 'truck', title: 'Free shipping over $75', copy: 'Arrives in 2–4 business days' },
  { icon: 'refresh', title: '30-day returns', copy: 'Free return label included' },
  { icon: 'shield', title: '2-year warranty', copy: 'Repairs handled in-house' },
] as const

export function ProductPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const add = useCart((state) => state.add)

  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const { data: product, loading, error } = useAsync(
    (signal) => api.get<Product>(`/products/${slug}/`, { signal }),
    [slug],
  )
  const related = useAsync(
    (signal) => api.get<Product[]>(`/products/${slug}/related/`, { signal }),
    [slug],
  )

  useEffect(() => {
    setQuantity(1)
    setActiveImage(0)
  }, [slug])

  const images = useMemo(() => {
    if (!product) return []
    return [product.image_url, ...(product.gallery ?? []).map((image) => image.url)].filter(
      Boolean,
    )
  }, [product])

  if (loading) {
    return (
      <div className="page-shell grid min-h-[60vh] place-items-center">
        <Spinner className="h-6 w-6 text-ink-muted" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-shell py-16">
        <EmptyState
          icon="alert"
          title="Product not found"
          description={error ?? 'This item may have been removed from the catalog.'}
          action={
            <Link to="/products" className="btn-primary btn-sm">
              Browse all products
            </Link>
          }
        />
      </div>
    )
  }

  const soldOut = product.stock_status === 'out_of_stock'

  const handleAdd = () => {
    if (add(product, quantity)) {
      toast.success(`${product.name} added to your cart`)
    } else {
      toast.error('That item is out of stock.')
    }
  }

  const handleBuyNow = () => {
    if (!add(product, quantity)) {
      toast.error('That item is out of stock.')
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="page-shell py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <Link to="/products" className="hover:text-ink">
          Products
        </Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <Link to={`/products?category=${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
        <Icon name="chevronRight" className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-3xl bg-sand-150">
            <img
              key={images[activeImage]}
              src={images[activeImage] ?? ''}
              alt={product.name}
              className="aspect-square w-full object-cover animate-fade-up"
            />
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`overflow-hidden rounded-xl border-2 transition-colors ${
                    index === activeImage
                      ? 'border-ink'
                      : 'border-transparent hover:border-sand-300'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:py-2">
          <div className="flex items-center gap-3">
            <span className="eyebrow">{product.category.name}</span>
            {product.is_featured && (
              <span className="rounded-full bg-ember-wash px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ember-dark">
                Featured
              </span>
            )}
          </div>

          <h1 className="mt-3 display text-4xl leading-tight">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Stars rating={product.rating} showValue reviewCount={product.review_count} />
            <span className="text-xs text-ink-faint">SKU {product.sku || '—'}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-medium tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price != null && (
              <>
                <span className="text-base text-ink-faint line-through tabular-nums">
                  {formatCurrency(product.compare_at_price)}
                </span>
                <span className="rounded-full bg-ember-wash px-2 py-0.5 text-xs font-medium text-ember-dark">
                  Save {product.discount_percent}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">{product.summary}</p>

          {product.highlights && product.highlights.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Icon
                    name="check"
                    className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                    strokeWidth={2}
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                soldOut
                  ? 'bg-ink-faint'
                  : product.stock_status === 'low_stock'
                    ? 'bg-ember'
                    : 'bg-emerald-600'
              }`}
            />
            <span className="text-ink-soft">
              {soldOut
                ? 'Out of stock'
                : product.stock_status === 'low_stock'
                  ? `Low stock — only ${product.stock} left`
                  : 'In stock, ready to ship'}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={quantity}
              max={Math.max(product.stock, 1)}
              onChange={setQuantity}
              disabled={soldOut}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className="btn-primary flex-1 min-w-40"
            >
              <Icon name="cart" className="h-4 w-4" />
              Add to cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={soldOut}
              className="btn-outline"
            >
              Buy now
            </button>
          </div>

          <dl className="mt-8 divide-y divide-sand-200 border-y border-sand-200">
            {ASSURANCES.map((item) => (
              <div key={item.title} className="flex items-start gap-3 py-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-ink-soft">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-sm font-medium text-ink">{item.title}</dt>
                  <dd className="text-xs text-ink-muted">{item.copy}</dd>
                </div>
              </div>
            ))}
          </dl>

          {product.description && (
            <details className="group mt-6" open>
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-ink">
                Details
                <Icon
                  name="chevronDown"
                  className="h-4 w-4 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {product.description}
              </p>
            </details>
          )}
        </div>
      </div>

      {/* Related */}
      {related.data && related.data.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="display text-2xl">More from {product.category.name}</h2>
            <Link
              to={`/products?category=${product.category.slug}`}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
            >
              View all <Icon name="chevronRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {related.data.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
