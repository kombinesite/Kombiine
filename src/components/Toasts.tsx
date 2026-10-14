import { useUI } from '../store/useUI'
import { IconCheck, IconClose } from './Icons'
import { cx } from '../lib/format'

export default function Toasts() {
  const { toasts, dismissToast } = useUI()
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-float animate-slide-up',
            t.tone === 'success' && 'bg-gradient-to-r from-pink-600 to-fuchsia-600',
            t.tone === 'error' && 'bg-gradient-to-r from-red-500 to-rose-600',
            t.tone === 'info' && 'bg-gradient-to-r from-grape to-pink-900',
          )}
        >
          {t.tone === 'success' && <IconCheck className="h-5 w-5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="Fechar aviso" className="rounded-full p-1 hover:bg-white/20">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
