import { useToasts } from '../store/toasts'
import { Icon } from './Icon'

const TONE_STYLES: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sand-200 bg-white text-ink',
}

const TONE_ICON = {
  success: 'check',
  error: 'alert',
  info: 'spark',
} as const

export function Toasts() {
  const toasts = useToasts((state) => state.toasts)
  const dismiss = useToasts((state) => state.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card animate-slide-in ${
            TONE_STYLES[item.tone]
          }`}
        >
          <Icon
            name={TONE_ICON[item.tone]}
            className="mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={1.8}
          />
          <p className="flex-1 leading-snug">{item.message}</p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-full p-0.5 text-current/60 transition-opacity hover:opacity-100"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
