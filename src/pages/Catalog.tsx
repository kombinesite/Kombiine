import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSeo } from '../lib/seo'
import ProductCard from '../components/ProductCard'
import { IconSearch } from '../components/Icons'
import { CATEGORIES } from '../data/products'
import { brl, cx } from '../lib/format'
import type { Category } from '../types'

type Sort = 'relevancia' | 'menor' | 'maior' | 'avaliacao' | 'vendas'

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: 'relevancia', label: 'Mais relevantes' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
  { value: 'avaliacao', label: 'Melhor avaliação' },
  { value: 'vendas', label: 'Mais vendidos' },
]

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Catalog() {
  const { category } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const products = useStore((s) => s.products)

  const [sort, setSort] = useState<Sort>('relevancia')
  const [maxPrice, setMaxPrice] = useState(400)
  const [onlyPromo, setOnlyPromo] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [query, setQuery] = useState(params.get('busca') ?? '')

  const activeCategory = category
    ? (CATEGORIES.find((c) => normalize(c) === normalize(category)) as Category | undefined)
    : undefined

  useSeo(
    activeCategory ? `${activeCategory} — KOMBINE` : 'Catálogo completo — KOMBINE',
    `Confira ${products.length} produtos de moda & lifestyle na KOMBINE. Pix com 10% OFF e frete grátis acima de R$199.`,
    '/catalogo',
  )

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeCategory) list = list.filter((p) => p.category === activeCategory)
    const q = normalize(query.trim())
    if (q) list = list.filter((p) => normalize(p.name).includes(q) || normalize(p.category).includes(q) || normalize(p.tagline).includes(q))
    list = list.filter((p) => p.price <= maxPrice)
    if (onlyPromo) list = list.filter((p) => p.promo)
    if (inStock) list = list.filter((p) => p.stock > 0)

    switch (sort) {
      case 'menor': list.sort((a, b) => a.price - b.price); break
      case 'maior': list.sort((a, b) => b.price - a.price); break
      case 'avaliacao': list.sort((a, b) => b.rating - a.rating); break
      case 'vendas': list.sort((a, b) => b.sales - a.sales); break
      default: list.sort((a, b) => Number(b.bestseller ?? false) - Number(a.bestseller ?? false))
    }
    return list
  }, [products, activeCategory, query, maxPrice, onlyPromo, inStock, sort])

  const chip = (active: boolean) =>
    cx(
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      active ? 'bg-pink-600 text-white shadow-portal' : 'border border-pink-200 bg-white text-grape hover:border-pink-400',
    )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-grape sm:text-4xl">
          {activeCategory ? activeCategory : 'Catálogo completo'}
        </h1>
        <p className="mt-1.5 text-ink-soft">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos'} · Consulte condições de pagamento e entrega no checkout
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* FILTROS */}
        <aside aria-label="Filtros" className="space-y-6 self-start rounded-3xl border border-pink-100 bg-white p-5 lg:sticky lg:top-24">
          <div>
            <label htmlFor="busca-catalogo" className="mb-2 block text-sm font-bold text-grape">Buscar</label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
              <input
                id="busca-catalogo"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (e.target.value) setParams((p) => { p.set('busca', e.target.value); return p }, { replace: true }) }}
                placeholder="Nome, categoria…"
                className="w-full rounded-full border border-pink-200 bg-pink-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-500 focus:bg-white"
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-grape">Categoria</legend>
            <div className="flex flex-wrap gap-2">
              <button className={chip(!activeCategory)} onClick={() => navigate('/catalogo')}>Todas</button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={chip(activeCategory === c)}
                  aria-pressed={activeCategory === c}
                  onClick={() => navigate(`/catalogo/${c.toLowerCase()}`)}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="preco-max" className="mb-2 flex items-center justify-between text-sm font-bold text-grape">
              Preço máximo <span className="text-pink-700">{brl(maxPrice)}</span>
            </label>
            <input
              id="preco-max"
              type="range"
              min={40}
              max={400}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-pink-600"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-grape">Opções</legend>
            <div className="grid gap-2.5 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-grape">
                <input type="checkbox" checked={onlyPromo} onChange={(e) => setOnlyPromo(e.target.checked)} className="h-4 w-4 accent-pink-600" />
                Somente promoções
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-grape">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-pink-600" />
                Em estoque
              </label>
            </div>
          </fieldset>

          <button
            onClick={() => { setQuery(''); setMaxPrice(400); setOnlyPromo(false); setInStock(false); setParams({}); navigate('/catalogo') }}
            className="w-full rounded-full border border-pink-200 py-2 text-sm font-semibold text-ink-soft hover:bg-pink-50"
          >
            Limpar filtros
          </button>
        </aside>

        {/* RESULTADOS */}
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" aria-live="polite">{filtered.length} resultados</p>
            <div className="flex items-center gap-2">
              <label htmlFor="ordenar" className="text-sm font-semibold text-grape">Ordenar:</label>
              <select
                id="ordenar"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-grape outline-none focus:border-pink-500"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-pink-100 bg-white py-20 text-center">
              <p className="text-4xl" aria-hidden="true">🔍</p>
              <p className="mt-3 font-display font-bold text-grape">Nada encontrado por aqui</p>
              <p className="mt-1 text-sm text-ink-soft">Tente ajustar os filtros ou buscar outro termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
