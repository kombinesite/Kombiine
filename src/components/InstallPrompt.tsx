import { useEffect, useState } from 'react'
import { useInstall } from '../lib/install'
import { IconClose, IconInstall } from './Icons'

export default function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstall()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!canInstall) return
    const t = setTimeout(() => setVisible(true), 4500)
    return () => clearTimeout(t)
  }, [canInstall])

  if (!canInstall || !visible) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar o aplicativo KOMBINE"
      className="fixed bottom-4 left-4 z-[70] w-[min(92vw,22rem)] rounded-3xl border border-pink-200 bg-white/95 p-4 shadow-float backdrop-blur animate-slide-up"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 text-white">
          <IconInstall />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-grape">Instale o app KOMBINE</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            Compre mais rápido, receba ofertas exclusivas e acompanhe seus pedidos direto na tela inicial.
          </p>
        </div>
        <button onClick={dismiss} aria-label="Dispensar" className="rounded-full p-1 text-ink-soft hover:bg-pink-100">
          <IconClose className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={dismiss} className="btn-ghost px-4 py-2.5 text-xs">Agora não</button>
        <button onClick={() => { promptInstall() }} className="btn-portal px-4 py-2.5 text-xs">Instalar</button>
      </div>
    </div>
  )
}
