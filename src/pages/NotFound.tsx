import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo'
import Logo from '../components/Logo'

export default function NotFound() {
  useSeo('Página não encontrada — KOMBINE')
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <Logo className="w-44 animate-float" />
      <h1 className="mt-6 font-display text-5xl font-extrabold text-grape">404</h1>
      <p className="mt-2 text-lg text-ink-soft">Essa estrada não existe — a Kombi se perdeu um pouco. 🛤️</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-portal px-8 py-3.5">Voltar ao início</Link>
        <Link to="/catalogo" className="btn-ghost px-8 py-3.5">Ver catálogo</Link>
      </div>
    </div>
  )
}
