import { Link } from 'react-router-dom'
import Logo from './Logo'
import { IconPix, IconWhats } from './Icons'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/products'

export default function Footer() {
  const settings = useStore((s) => s.settings)
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 bg-grape text-pink-100">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="h-20 w-20" compact />
            <p className="mt-3 font-script text-3xl text-pink-300">{settings.storeName}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-pink-200/90">
              {settings.footerDescription}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <IconWhats className="h-5 w-5 text-pink-300" />
              <a href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}`} className="hover:text-white" rel="noopener noreferrer" target="_blank">
                {settings.whatsapp}
              </a>
            </div>
          </div>

          <nav aria-label="Categorias">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Categorias</h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link to={`/catalogo/${c.toLowerCase()}`} className="text-pink-200 hover:text-white">{c}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Ajuda">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Ajuda</h2>
            <ul className="mt-4 grid gap-2 text-sm">
              <li className="text-pink-200">{settings.footerHelpShipping}</li>
              <li className="text-pink-200">{settings.footerHelpReturns}</li>
              <li className="text-pink-200">{settings.footerHelpPayment}</li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Formas de pagamento</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              {['VISA', 'MASTER', 'ELO', 'AMEX'].map((b) => (
                <span key={b} className="rounded-lg bg-white/10 px-3 py-2 tracking-wide text-white">{b}</span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/30 px-3 py-2 text-white">
                <IconPix className="h-4 w-4" /> PIX
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-pink-200/80">{settings.paymentPolicy}</p>
            <p className="mt-4 text-xs leading-relaxed text-pink-200/80">
              {settings.email}<br />{settings.address}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-pink-300 sm:flex-row">
          <p>© {year} {settings.storeName} · {settings.footerCopyright}</p>
          <p className="inline-flex items-center gap-2">
            Feito com <span className="text-pink-400">💗</span> para quem vive em rosa
          </p>
        </div>
      </div>
    </footer>
  )
}
