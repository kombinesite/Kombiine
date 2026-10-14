import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../store/useCart'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { useSeo } from '../lib/seo'
import ProductArt from '../components/ProductArt'
import { IconCart, IconMinus, IconPlus, IconTrash, IconTruck } from '../components/Icons'
import { brl } from '../lib/format'

const COUPONS: Record<string, number> = { KOMBINE10: 10, BEMVINDA: 15, ROSA20: 20 }

export default function CartPage() {
  useSeo('Carrinho — KOMBINE', 'Revise seus itens e finalize seu pedido na KOMBINE.')
  const { items, setQty, remove, coupon, applyCoupon, clear } = useCart()
  const products = useStore((s) => s.products)
  const settings = useStore((s) => s.settings)
  const toast = useUI((s) => s.toast)
  const [code, setCode] = useState(coupon ?? '')

  const lines = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId)
      return product ? { item: i, product } : null
    })
    .filter(Boolean) as Array<{ item: typeof items[number]; product: typeof products[number] }>

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0)
  const couponDiscount = coupon && COUPONS[coupon] ? (subtotal * COUPONS[coupon]) / 100 : 0
  const shipping = subtotal >= settings.freeShippingMin || subtotal === 0 ? 0 : settings.shippingFee

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <IconCart className="mx-auto h-16 w-16 text-pink-300" />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-grape">Seu carrinho está vazio</h1>
        <p className="mt-2 text-ink-soft">Adicione produtos incríveis e aproveite o frete grátis acima de {brl(settings.freeShippingMin)}.</p>
        <Link to="/catalogo" className="btn-portal mt-6 inline-flex px-8 py-4">Explorar catálogo</Link>
      </div>
    )
  }

  const applyCode = () => {
    const c = code.trim().toUpperCase()
    if (COUPONS[c]) {
      applyCoupon(c)
      toast(`Cupom ${c} aplicado: ${COUPONS[c]}% de desconto 🎉`)
    } else {
      applyCoupon(null)
      toast('Cupom inválido ou expirado', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold text-grape sm:text-4xl">Seu carrinho</h1>
      <p className="mt-1 text-ink-soft">{lines.length} {lines.length === 1 ? 'item' : 'itens'} selecionados</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {lines.map(({ item, product }) => (
            <li key={`${item.productId}-${item.variant}`} className="card-premium flex gap-4 p-4">
              <Link to={`/produto/${product.slug}`} className="shrink-0">
                <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="h-24 w-24 rounded-2xl sm:h-32 sm:w-32" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/produto/${product.slug}`} className="font-display text-base font-bold text-grape hover:text-pink-700">
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-soft">{product.variants.label}: {item.variant}</p>
                    <p className="mt-0.5 text-xs text-pink-700">Estoque: {product.stock} disponíveis</p>
                  </div>
                  <button onClick={() => remove(item.productId, item.variant)} aria-label={`Remover ${product.name}`} className="rounded-full p-2 text-pink-500 hover:bg-pink-100">
                    <IconTrash />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-full border-2 border-pink-200">
                    <button onClick={() => setQty(item.productId, item.variant, item.qty - 1)} aria-label="Diminuir" className="rounded-full p-2 text-pink-700 hover:bg-pink-100"><IconMinus className="h-4 w-4" /></button>
                    <span className="min-w-8 text-center font-bold" aria-live="polite">{item.qty}</span>
                    <button onClick={() => setQty(item.productId, item.variant, item.qty + 1)} aria-label="Aumentar" className="rounded-full p-2 text-pink-700 hover:bg-pink-100"><IconPlus className="h-4 w-4" /></button>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold text-grape">{brl(product.price * item.qty)}</p>
                    {item.qty > 1 && <p className="text-xs text-ink-soft">{brl(product.price)} un.</p>}
                  </div>
                </div>
              </div>
            </li>
          ))}
          <li>
            <button onClick={clear} className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-pink-700 hover:underline">
              Limpar carrinho
            </button>
          </li>
        </ul>

        <aside className="self-start rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:sticky lg:top-24" aria-label="Resumo do pedido">
          <h2 className="font-display text-lg font-bold text-grape">Resumo</h2>

          <div className="mt-4">
            <label htmlFor="cupom" className="text-sm font-semibold text-grape">Cupom de desconto</label>
            <div className="mt-2 flex gap-2">
              <input
                id="cupom"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex.: KOMBINE10"
                className="min-w-0 flex-1 rounded-full border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm uppercase outline-none focus:border-pink-500 focus:bg-white"
              />
              <button onClick={applyCode} className="btn-ghost px-5 py-2.5 text-sm">Aplicar</button>
            </div>
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-bold text-grape">{brl(subtotal)}</dd></div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-pink-700"><dt>Cupom {coupon}</dt><dd className="font-bold">-{brl(couponDiscount)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="inline-flex items-center gap-1.5 text-ink-soft"><IconTruck className="h-4 w-4" /> Frete</dt>
              <dd className="font-bold text-grape">{shipping === 0 ? <span className="text-pink-700">Grátis 🎉</span> : brl(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-pink-100 pt-3 text-base">
              <dt className="font-bold text-grape">Total</dt>
              <dd className="font-display font-extrabold text-grape">{brl(subtotal - couponDiscount + shipping)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-ink-soft">
            Pix com {settings.pixDiscount}% de desconto aplicado na próxima etapa.
          </p>

          <Link to="/checkout" className="btn-portal mt-5 w-full px-6 py-4">Ir para o checkout</Link>
          <Link to="/catalogo" className="mt-3 block text-center text-sm font-semibold text-pink-700 hover:underline">
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
