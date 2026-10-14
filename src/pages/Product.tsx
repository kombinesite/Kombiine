import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useCart } from '../store/useCart'
import { useUI } from '../store/useUI'
import { useSeo } from '../lib/seo'
import ProductArt from '../components/ProductArt'
import ProductCard, { Stars } from '../components/ProductCard'
import QuantityStepper from '../components/QuantityStepper'
import { IconCart, IconCheck, IconClose, IconPix, IconShield, IconTruck, IconRefresh } from '../components/Icons'
import { brl, cx } from '../lib/format'

export default function ProductPage() {
  const { slug } = useParams()
  const products = useStore((s) => s.products)
  const settings = useStore((s) => s.settings)
  const add = useCart((s) => s.add)
  const toast = useUI((s) => s.toast)
  const setCartOpen = useUI((s) => s.setCartOpen)

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug])

  const [variant, setVariant] = useState('')
  const [qty, setQty] = useState(1)
  const [lightbox, setLightbox] = useState(false)
  const [tab, setTab] = useState<'desc' | 'envio'>('desc')

  useEffect(() => {
    if (product && !variant) setVariant(product.variants.options[0])
  }, [product, variant])

  useSeo(
    product ? `${product.name} — KOMBINE` : 'Produto — KOMBINE',
    product?.description.slice(0, 155),
    product ? `/produto/${product.slug}` : undefined,
  )

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-5xl" aria-hidden="true">🛵</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-grape">Produto não encontrado</h1>
        <p className="mt-2 text-ink-soft">A Kombi saiu para outra estrada. Que tal voltar ao catálogo?</p>
        <Link to="/catalogo" className="btn-portal mt-6 inline-flex px-7 py-3">Ver catálogo</Link>
      </div>
    )
  }

  const pixPrice = product.price * (1 - settings.pixDiscount / 100)
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const soldOut = product.stock <= 0
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const addToCart = (openDrawer = true) => {
    add({ productId: product.id, qty, variant })
    toast(`${product.name} (${variant}) no carrinho 🛍️`)
    if (openDrawer) setCartOpen(true)
  }

  const buyNow = () => {
    add({ productId: product.id, qty, variant })
    window.location.href = '/checkout'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-ink-soft">
        <Link to="/" className="hover:text-pink-700">Início</Link>
        {' / '}
        <Link to={`/catalogo/${product.category.toLowerCase()}`} className="hover:text-pink-700">{product.category}</Link>
        {' / '}
        <span className="font-semibold text-grape">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* GALERIA */}
        <div>
          <button
            className="zoomable relative block w-full"
            onClick={() => setLightbox(true)}
            aria-label={`Ampliar foto de ${product.name}`}
          >
            <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="w-full rounded-[2rem] shadow-card" />
            {discount > 0 && (
              <span className="absolute left-5 top-5 rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-1.5 text-sm font-extrabold text-white shadow">
                -{discount}%
              </span>
            )}
            <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-grape shadow">
              🔍 Clique para ampliar
            </span>
          </button>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {['#FFF0F7', '#FFE4F1', '#FFD6EA'].map((bg, i) => (
              <button
                key={bg}
                onClick={() => setLightbox(true)}
                className="overflow-hidden rounded-2xl border-2 border-transparent transition hover:border-pink-400"
                aria-label={`Ver foto ${i + 1} ampliada`}
              >
                <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="aspect-square w-full" style={{ background: bg }} />
              </button>
            ))}
          </div>
        </div>

        {/* INFORMAÇÕES */}
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-700">{product.category}</span>
            {product.bestseller && <span className="rounded-full bg-grape px-3 py-1 text-xs font-bold text-pink-200">⭐ Mais vendido</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-grape sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-lg text-ink-soft">{product.tagline}</p>
          <div className="mt-3"><Stars rating={product.rating} reviews={product.reviews} className="text-sm" /></div>

          <div className="mt-6 rounded-3xl border border-pink-100 bg-white p-5 shadow-card">
            {product.oldPrice && (
              <p className="text-sm text-ink-soft line-through">De {brl(product.oldPrice)}</p>
            )}
            <p className="font-display text-4xl font-extrabold text-grape">
              {brl(product.price)}
              {discount > 0 && (
                <span className="ml-2 align-middle text-base font-bold text-pink-600">({discount}% OFF)</span>
              )}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Consulte as opções de parcelamento disponíveis no checkout.</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-800">
              <IconPix className="h-5 w-5" /> Pix: <span className="font-extrabold">{brl(pixPrice)}</span>
              <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[11px] text-white">{settings.pixDiscount}% OFF</span>
            </p>
            <p className={cx('mt-3 text-sm font-semibold', soldOut ? 'text-red-500' : product.stock <= 10 ? 'text-gold' : 'text-pink-700')}>
              {soldOut ? 'Produto esgotado' : product.stock <= 10 ? `🔥 Últimas ${product.stock} unidades!` : `${product.stock} unidades em estoque`}
            </p>
          </div>

          {/* VARIANTES */}
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-bold text-grape">{product.variants.label}</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setVariant(opt)}
                  aria-pressed={variant === opt}
                  className={cx(
                    'min-w-14 rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition',
                    variant === opt
                      ? 'border-pink-600 bg-pink-600 text-white shadow-portal'
                      : 'border-pink-200 bg-white text-grape hover:border-pink-400',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantityStepper qty={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <button onClick={() => addToCart(true)} disabled={soldOut} className="btn-portal flex-1 px-8 py-4 text-base disabled:pointer-events-none">
              <IconCart /> Adicionar ao carrinho
            </button>
          </div>
          <button onClick={buyNow} disabled={soldOut} className="btn-ghost mt-3 w-full px-8 py-4 text-base disabled:pointer-events-none">
            Comprar agora
          </button>

          <ul className="mt-6 grid gap-2.5 rounded-3xl bg-pink-50 p-5 text-sm text-grape sm:grid-cols-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 shrink-0 text-pink-600" /> {h}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-grape">
            {[
              { icon: <IconTruck className="h-5 w-5" />, t: `Frete grátis + ${brl(settings.freeShippingMin)}` },
              { icon: <IconRefresh className="h-5 w-5" />, t: 'Consulte as trocas' },
              { icon: <IconShield className="h-5 w-5" />, t: 'Checkout validado' },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl border border-pink-100 bg-white p-3">
                <span className="mx-auto block text-pink-600">{b.icon}</span>
                <span className="mt-1.5 block leading-tight">{b.t}</span>
              </div>
            ))}
          </div>

          {/* ABAS */}
          <div className="mt-8">
            <div role="tablist" aria-label="Informações do produto" className="flex gap-2 border-b border-pink-100">
              {([['desc', 'Descrição'], ['envio', 'Envio e trocas']] as const).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cx(
                    'border-b-3 px-4 py-2.5 text-sm font-bold transition',
                    tab === id ? 'border-pink-600 text-pink-700' : 'border-transparent text-ink-soft hover:text-grape',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-4 text-[15px] leading-relaxed text-ink-soft" role="tabpanel">
              {tab === 'desc' ? (
                <>
                  <p>{product.description}</p>
                  <ul className="mt-3 list-inside list-disc space-y-1">
                    {product.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </>
              ) : (
                <ul className="space-y-2">
                  <li>🚚 {settings.shippingPolicy}</li>
                  <li>📦 Frete grátis para compras acima de {brl(settings.freeShippingMin)}; abaixo disso, {brl(settings.shippingFee)} para todo o Brasil.</li>
                  <li>🔄 {settings.returnsPolicy}</li>
                  <li>🔒 {settings.paymentPolicy}</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RELACIONADOS */}
      {related.length > 0 && (
        <section aria-labelledby="titulo-relacionados" className="pt-16">
          <h2 id="titulo-relacionados" className="font-display text-2xl font-extrabold text-grape">
            Você também pode <span className="gradient-text">curtir</span>
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-grape/80 p-4 backdrop-blur-sm animate-fade" role="dialog" aria-modal="true" aria-label={`Foto ampliada de ${product.name}`}>
          <button onClick={() => setLightbox(false)} aria-label="Fechar" className="absolute right-5 top-5 rounded-full bg-white p-2.5 text-grape shadow hover:bg-pink-100">
            <IconClose className="h-6 w-6" />
          </button>
          <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="max-h-[86vh] w-auto max-w-full rounded-3xl shadow-2xl animate-pop" />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-grape">
            {product.name}
          </p>
        </div>
      )}
    </div>
  )
}
