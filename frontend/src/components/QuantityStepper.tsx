import { Icon } from './Icon'

interface QuantityStepperProps {
  value: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
  compact?: boolean
}

export function QuantityStepper({
  value,
  max = 50,
  onChange,
  disabled,
  compact,
}: QuantityStepperProps) {
  const ceiling = Math.max(1, Math.min(max, 50))
  const size = compact ? 'h-8 w-8' : 'h-10 w-10'

  return (
    <div
      className={`inline-flex items-center rounded-full border border-sand-200 bg-white ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
        className={`${size} grid place-items-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-40`}
      >
        <Icon name="minus" className="h-3.5 w-3.5" />
      </button>
      <span
        className={`min-w-8 text-center text-sm font-medium tabular-nums ${
          compact ? 'text-xs' : ''
        }`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= ceiling}
        aria-label="Increase quantity"
        className={`${size} grid place-items-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-40`}
      >
        <Icon name="plus" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
