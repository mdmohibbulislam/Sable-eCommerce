import { Icon } from './Icon'

interface StarsProps {
  rating: number
  className?: string
  showValue?: boolean
  reviewCount?: number
}

export function Stars({ rating, className = '', showValue, reviewCount }: StarsProps) {
  const filled = Math.round(rating)
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <Icon
            key={index}
            name="star"
            strokeWidth={1.2}
            className={`h-3.5 w-3.5 ${
              index <= filled ? 'fill-ember text-ember' : 'fill-transparent text-sand-300'
            }`}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs text-ink-muted">
          {rating.toFixed(1)}
          {reviewCount != null && ` (${reviewCount})`}
        </span>
      )}
    </span>
  )
}
