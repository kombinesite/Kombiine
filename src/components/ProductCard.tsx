import { Link } from 'react-router-dom'
import type { Product } from '../types'
import ProductArt from './ProductArt'
import { IconCart, IconStar } from './Icons'
import { useCart } from '../store/useCart'
import { useUI } from '../store/useUI'
import { brl, cx } from '../lib/format'

export function Stars({ rating, reviews, className = '' }: { rating: number; reviews?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs text-ink-soft', className)}>
      <span className="flex text-gold" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <IconStar key={i} className={cx('h-3.5 w-3.5', i + 1 > Math.round(rating) && 'text-pink-200')} />
        ))}
      </span>
      {reviews === 0 ? <span className="text-ink-soft">Sem avaliações</span> : <><span className="sr-only">Avaliação {rating} de 5</span><strong className="text-grape">{rating.toFixed(1)}</strong>{reviews !== undefined && <span>({reviews})</span>}</>}
    </span>
  )
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add)
  const toast = useUI((s) => s.toast)
  const setCartOpen = useUI((s) => s.setCartOpen)
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const soldOut = product.stock <= 0

  const quickAdd = () => {
    if (soldOut) return
    add({ productId: product.id, qty: 1, variant: product.variants.options[0] })
    toast(`${product.name} adicionado ao carrinho 🛍️`)
    setCartOpen(true)
  }

  return (
    <article
      className="card-premium group relative flex flex-col overflow-hidden"
      style={{ animation: `slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${Math.min(index * 60, 400)}ms both` }}
    >
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 px-3 py-1 text-[11px] font-extrabold text-white shadow">
            -{discount}%
          </span>
        )}
        {product.bestseller && (
          <span className="rounded-full bg-grape px-3 py-1 text-[11px] font-bold text-pink-200">Mais vendido</span>
        )}
        {soldOut && (
          <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-white">Esgotado</span>
        )}
      </div>

      <Link to={`/produto/${product.slug}`} className="zoomable relative block aspect-square" aria-label={`Ver ${product.name}`}>
        <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="h-full w-full" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-pink-700">
            {product.category}
          </span>
          <Stars rating={product.rating} reviews={product.reviews} />
        </div>

        <Link to={`/produto/${product.slug}`} className="line-clamp-2 font-display text-[15px] font-bold leading-snug text-grape hover:text-pink-700">
          {product.name}
        </Link>
        <p className="line-clamp-1 text-xs text-ink-soft">{product.tagline}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.oldPrice && (
              <p className="text-xs text-ink-soft line-through">{brl(product.oldPrice)}</p>
            )}
            <p className="font-display text-lg font-extrabold leading-tight text-grape">{brl(product.price)}</p>
            <p className="text-[11px] text-ink-soft">Preço por unidade</p>
          </div>
          <button
            onClick={quickAdd}
            disabled={soldOut}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="btn-portal h-11 w-11 shrink-0 !p-0 disabled:pointer-events-none"
          >
            <IconCart />
          </button>
        </div>
      </div>
    </article>
  )
}
