import { IconMinus, IconPlus } from './Icons'

interface Props {
  qty: number
  onChange: (qty: number) => void
  min?: number
  max?: number
  label?: string
}

export default function QuantityStepper({ qty, onChange, min = 1, max = 99, label = 'quantidade' }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border-2 border-pink-200 bg-white" role="group" aria-label={`Selecionar ${label}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        aria-label={`Diminuir ${label}`}
        className="rounded-full p-2.5 text-pink-700 transition hover:bg-pink-100 disabled:opacity-30"
      >
        <IconMinus className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center font-display font-bold text-grape" aria-live="polite">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        aria-label={`Aumentar ${label}`}
        className="rounded-full p-2.5 text-pink-700 transition hover:bg-pink-100 disabled:opacity-30"
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  )
}
