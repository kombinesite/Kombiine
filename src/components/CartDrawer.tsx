import { Link } from 'react-router-dom'
import { useCart, cartCount } from '../store/useCart'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { IconClose, IconMinus, IconPlus, IconTrash, IconTruck } from './Icons'
import ProductArt from './ProductArt'
import { brl, cx } from '../lib/format'

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI()
  const { items, setQty, remove } = useCart()
  const products = useStore((s) => s.products)
  const settings = useStore((s) => s.settings)

  const lines = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId)
      return product ? { item: i, product } : null
    })
    .filter(Boolean) as Array<{ item: typeof items[number]; product: typeof products[number] }>

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0)
  const missing = Math.max(0, settings.freeShippingMin - subtotal)
  const progress = Math.min(100, (subtotal / settings.freeShippingMin) * 100)

  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      <button className="absolute inset-0 bg-grape/50 backdrop-blur-sm animate-fade" aria-label="Fechar carrinho" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-float animate-slide-left">
        <header className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-grape">
            Seu carrinho{' '}
            <span className="text-pink-600">({cartCount(items)})</span>
          </h2>
          <button onClick={() => setCartOpen(false)} aria-label="Fechar" className="rounded-full p-2 hover:bg-pink-100">
            <IconClose />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="text-5xl" aria-hidden="true">🧺</span>
            <p className="font-display font-bold text-grape">Seu carrinho está vazio</p>
            <p className="text-sm text-ink-soft">Que tal começar pelo catálogo? Tem muita coisa rosa esperando por você.</p>
            <Link to="/catalogo" onClick={() => setCartOpen(false)} className="btn-portal px-6 py-3 text-sm">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-pink-100 bg-pink-50 px-5 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-grape">
                <IconTruck className="h-4 w-4 text-pink-600" />
                {missing > 0 ? (
                  <>Faltam <strong className="text-pink-700">{brl(missing)}</strong> para frete grátis</>
                ) : (
                  <strong className="text-pink-700">Você ganhou frete grátis! 🎉</strong>
                )}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-pink-200" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso para frete grátis">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-700 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {lines.map(({ item, product }) => (
                <li key={`${item.productId}-${item.variant}`} className="flex gap-3">
                  <Link to={`/produto/${product.slug}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="h-20 w-20 rounded-2xl" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/produto/${product.slug}`} onClick={() => setCartOpen(false)} className="line-clamp-2 text-sm font-bold text-grape hover:text-pink-700">
                        {product.name}
                      </Link>
                      <button onClick={() => remove(item.productId, item.variant)} aria-label={`Remover ${product.name}`} className="rounded-full p-1.5 text-pink-500 hover:bg-pink-100">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">{product.variants.label}: {item.variant}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-pink-200">
                        <button onClick={() => setQty(item.productId, item.variant, item.qty - 1)} aria-label="Diminuir quantidade" className="rounded-full p-1.5 text-pink-700 hover:bg-pink-100">
                          <IconMinus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">{item.qty}</span>
                        <button onClick={() => setQty(item.productId, item.variant, item.qty + 1)} aria-label="Aumentar quantidade" className="rounded-full p-1.5 text-pink-700 hover:bg-pink-100">
                          <IconPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-display font-bold text-grape">{brl(product.price * item.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-pink-100 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-display text-xl font-extrabold text-grape">{brl(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-soft">
                Desconto Pix configurado: <strong className="text-pink-700">{settings.pixDiscount}%</strong> · {settings.paymentPolicy}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/carrinho" onClick={() => setCartOpen(false)} className="btn-ghost px-4 py-3 text-sm">
                  Ver carrinho
                </Link>
                <Link to="/checkout" onClick={() => setCartOpen(false)} className={cx('btn-portal px-4 py-3 text-sm')}>
                  Finalizar
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
