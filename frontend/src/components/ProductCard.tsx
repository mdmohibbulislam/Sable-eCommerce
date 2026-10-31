import { Link } from 'react-router-dom'

import { formatCurrency } from '../lib/format'
import { useCart } from '../store/cart'
import { toast } from '../store/toasts'
import type { Product } from '../types'
import { Icon } from './Icon'
import { Stars } from './Stars'

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((state) => state.add)

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (add(product)) {
      toast.success(`${product.name} added to your cart`)
    } else {
      toast.error('That item is out of stock.')
    }
  }

  const soldOut = product.stock_status === 'out_of_stock'

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative overflow-hidden rounded-2xl bg-sand-150">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className={`aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
            soldOut ? 'opacity-70' : ''
          }`}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_on_sale && (
            <span className="rounded-full bg-ember px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              −{product.discount_percent}%
            </span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sand-50">
              Sold out
            </span>
          )}
          {product.stock_status === 'low_stock' && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
              Low stock
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-xs font-semibold text-ink shadow-sm backdrop-blur transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        >
          <Icon name="cart" className="h-4 w-4" strokeWidth={1.7} />
          {soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="eyebrow">{product.category?.name}</p>
        <h3 className="text-sm font-medium leading-snug text-ink transition-colors group-hover:text-ember">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price != null && (
              <span className="text-xs text-ink-faint line-through tabular-nums">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          <Stars rating={product.rating} />
        </div>
      </div>
    </Link>
  )
}
