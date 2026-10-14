import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { IconCart, IconClose, IconInstall, IconMenu, IconSearch } from './Icons'
import { useCart } from '../store/useCart'
import { useUI } from '../store/useUI'
import { useStore } from '../store/useStore'
import { useInstall } from '../lib/install'
import { cartCount } from '../store/useCart'
import { cx } from '../lib/format'
import { CATEGORIES } from '../data/products'

export default function Header() {
  const items = useCart((s) => s.items)
  const { setCartOpen, setSearchOpen } = useUI()
  const settings = useStore((s) => s.settings)
  const products = useStore((s) => s.products)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<typeof products>([])
  const navigate = useNavigate()
  const { canInstall, promptInstall } = useInstall()
  const searchRef = useRef<HTMLFormElement>(null)

  const count = cartCount(items)

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    setSuggestions(
      products
        .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        .slice(0, 5),
    )
  }, [query, products])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSuggestions([])
    navigate(`/catalogo?busca=${encodeURIComponent(query.trim())}`)
  }

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      isActive ? 'bg-pink-600 text-white shadow-portal' : 'text-grape hover:bg-pink-100',
    )

  return (
    <>
      {/* Faixa de anúncio */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-fuchsia-500 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between overflow-hidden px-4 py-2 text-xs font-semibold sm:text-sm">
          <p className="truncate">{settings.announcement}</p>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            {canInstall && (
              <button onClick={promptInstall} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                <IconInstall className="h-4 w-4" /> Instalar app
              </button>
            )}
          </div>
        </div>
      </div>

      <header className="glass sticky top-0 z-40 border-b border-pink-100">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4">
          <button
            className="rounded-full p-2 text-grape hover:bg-pink-100 lg:hidden"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>

          <Link to="/" className="flex items-center" aria-label="KOMBINE — página inicial">
            <Logo className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" compact />
            <span className="ml-2 hidden font-script text-2xl leading-none text-pink-600 sm:block lg:text-3xl">{settings.storeName}</span>
          </Link>

          <nav aria-label="Navegação principal" className="ml-4 hidden items-center gap-1 lg:flex">
            <NavLink to="/" end className={navLink}>Início</NavLink>
            <NavLink to="/catalogo" className={navLink}>Catálogo</NavLink>
            {CATEGORIES.slice(0, 4).map((c) => (
              <NavLink key={c} to={`/catalogo/${c.toLowerCase()}`} className={navLink}>
                {c}
              </NavLink>
            ))}
          </nav>

          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <form role="search" onSubmit={submitSearch} className="relative">
              <label htmlFor="busca-desktop" className="sr-only">Buscar produtos</label>
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
              <input
                id="busca-desktop"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos, categorias…"
                className="w-full rounded-full border border-pink-200 bg-pink-50 py-2.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-pink-400 focus:border-pink-500 focus:bg-white"
              />
            </form>
            {suggestions.length > 0 && (
              <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-float" role="listbox">
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/produto/${p.slug}`}
                      onClick={() => setSuggestions([])}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-pink-50"
                      role="option"
                    >
                      <span className="font-semibold">{p.name}</span>
                      <span className="ml-auto text-pink-700">R$ {p.price.toFixed(2)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button
              className="rounded-full p-2.5 text-grape hover:bg-pink-100 md:hidden"
              aria-label="Buscar"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 text-grape transition hover:bg-pink-100"
              aria-label={`Abrir carrinho${count ? ` com ${count} itens` : ''}`}
            >
              <IconCart className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[11px] font-bold text-white shadow animate-pop">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <nav aria-label="Menu mobile" className="border-t border-pink-100 bg-white px-4 pb-5 pt-3 lg:hidden animate-slide-up">
            <form onSubmit={submitSearch} className="relative mb-3 md:hidden">
              <label htmlFor="busca-mobile" className="sr-only">Buscar produtos</label>
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
              <input
                id="busca-mobile"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar na KOMBINE…"
                className="w-full rounded-full border border-pink-200 bg-pink-50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-pink-500"
              />
            </form>
            <ul className="grid gap-1">
              <li><NavLink to="/" end className={navLink} onClick={() => setMobileOpen(false)}>Início</NavLink></li>
              <li><NavLink to="/catalogo" className={navLink} onClick={() => setMobileOpen(false)}>Catálogo completo</NavLink></li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <NavLink to={`/catalogo/${c.toLowerCase()}`} className={navLink} onClick={() => setMobileOpen(false)}>
                    {c}
                  </NavLink>
                </li>
              ))}
              <li className="mt-2 flex gap-2">
                {canInstall && (
                  <button onClick={() => { promptInstall(); setMobileOpen(false) }} className="btn-portal flex-1 px-4 py-2.5 text-sm">
                    <IconInstall className="h-4 w-4" /> Instalar app
                  </button>
                )}
              </li>
            </ul>
          </nav>
        )}
      </header>

      <MobileSearchOverlay />
    </>
  )
}

function MobileSearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI()
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const results = query.trim().length >= 2
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  if (!searchOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-white p-4 animate-fade" role="dialog" aria-modal="true" aria-label="Busca">
      <div className="flex items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) { navigate(`/catalogo?busca=${encodeURIComponent(query.trim())}`); setSearchOpen(false) } }} className="relative flex-1">
          <label htmlFor="busca-overlay" className="sr-only">Buscar produtos</label>
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
          <input
            id="busca-overlay"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na KOMBINE…"
            className="w-full rounded-full border border-pink-200 bg-pink-50 py-3 pl-11 pr-4 outline-none focus:border-pink-500"
          />
        </form>
        <button onClick={() => setSearchOpen(false)} aria-label="Fechar busca" className="rounded-full p-2.5 hover:bg-pink-100">
          <IconClose className="h-6 w-6" />
        </button>
      </div>
      <ul className="mt-4 grid gap-1">
        {results.map((p) => (
          <li key={p.id}>
            <Link
              to={`/produto/${p.slug}`}
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-pink-50"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-sm text-pink-700">R$ {p.price.toFixed(2)}</span>
            </Link>
          </li>
        ))}
        {query.trim().length >= 2 && results.length === 0 && (
          <li className="px-4 py-6 text-center text-ink-soft">Nenhum produto encontrado para “{query}”.</li>
        )}
      </ul>
    </div>
  )
}
