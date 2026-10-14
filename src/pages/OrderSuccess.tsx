import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSeo } from '../lib/seo'
import ProductArt from '../components/ProductArt'
import { IconCheck, IconPix, IconTruck } from '../components/Icons'
import { brl, dateTimeBR } from '../lib/format'
import { getPaymentStatus } from '../lib/mercadopago'
import { apiUrl } from '../lib/api'

export default function OrderSuccess() {
  const { id } = useParams()
  const order = useStore((s) => s.orders.find((o) => o.id === id))
  const settings = useStore((s) => s.settings)
  const syncOrderStatusLocal = useStore((s) => s.syncOrderStatusLocal)
  const hydrateFromServer = useStore((s) => s.hydrateFromServer)

  useEffect(() => {
    if (!order || order.status !== 'pendente' || !order.payment.paymentId || order.payment.gateway !== 'mercadopago') return
    let active = true
    const check = async () => {
      try {
        const payment = await getPaymentStatus(order.payment.paymentId!)
        const next = payment.status === 'approved' ? 'pago' : ['cancelled','rejected','refunded','charged_back'].includes(payment.status) ? 'cancelado' : null
        if (active && next) {
          syncOrderStatusLocal(order.id, next)
          const response = await fetch(apiUrl('/api/store/state'))
          if (response.ok) hydrateFromServer(await response.json())
        }
      } catch { /* mantém a página utilizável durante falhas temporárias de rede */ }
    }
    void check()
    const timer = window.setInterval(() => void check(), 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [order?.id, order?.status, order?.payment.paymentId, order?.payment.gateway, syncOrderStatusLocal, hydrateFromServer])

  useSeo(order ? `${order.status === 'pago' ? 'Pedido confirmado' : 'Pedido'} ${order.id} — KOMBINE` : 'Pedido — KOMBINE')

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-grape">Pedido não encontrado</h1>
        <Link to="/catalogo" className="btn-portal mt-6 inline-flex px-7 py-3">Voltar ao catálogo</Link>
      </div>
    )
  }

  const viaMercadoPago = order.payment.gateway === 'mercadopago'
  const pixPayload = order.payment.method === 'pix' && viaMercadoPago ? order.payment.pixQrCode ?? null : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="card-premium overflow-hidden text-center">
        <div className="bg-gradient-to-br from-pink-500 to-pink-700 px-8 py-10 text-white">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/15 backdrop-blur animate-pop">
            <IconCheck className="h-10 w-10" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold">{order.status === 'pago' ? 'Pedido confirmado! 🎉' : order.status === 'cancelado' ? 'Pedido cancelado' : 'Pedido registrado'}</h1>
          <p className="mt-2 text-pink-100">
            Obrigado por comprar na KOMBINE, <strong>{order.customer.name.split(' ')[0]}</strong>!
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 font-mono text-sm font-bold backdrop-blur">
            {order.id} · {dateTimeBR(order.createdAt)}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {pixPayload && (
            <div className="rounded-3xl border-2 border-pink-100 bg-pink-50 p-5 text-left">
              <h2 className="inline-flex items-center gap-2 font-display font-bold text-grape">
                <IconPix className="h-5 w-5 text-pink-600" /> {order.status === 'pago' ? 'Pix confirmado' : 'Aguardando pagamento Pix'}
              </h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                O pedido é separado assim que o Pix cair (costuma levar segundos). Pague <strong className="text-pink-700">{brl(order.total)}</strong> com o código abaixo:
                {viaMercadoPago && <> · cobrança oficial do <strong className="text-pink-700">Mercado Pago</strong>{order.payment.paymentId ? ` (ID ${order.payment.paymentId})` : ''}.</>}
              </p>
              <p className="mt-3 break-all rounded-2xl bg-white p-3 font-mono text-[11px] leading-relaxed text-ink-soft max-h-20 overflow-y-auto">{pixPayload}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(pixPayload)}
                className="btn-portal mt-3 px-6 py-2.5 text-sm"
              >
                Copiar código Pix
              </button>
            </div>
          )}

          <h2 className="mt-8 text-left font-display text-lg font-bold text-grape">Itens do pedido</h2>
          <ul className="mt-4 space-y-3 text-left">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.variant}`} className="flex items-center gap-3 rounded-2xl border border-pink-100 p-3">
                <ProductArt art={item.art} imageUrl={item.imageUrl} mediaType={item.mediaType} className="h-14 w-14 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-grape">{item.name}</p>
                  <p className="text-xs text-ink-soft">{item.variant} · {item.qty}x {brl(item.price)}</p>
                </div>
                <p className="text-sm font-bold text-grape">{brl(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-pink-100 pt-4 text-left text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-bold text-grape">{brl(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-pink-700"><dt>Descontos</dt><dd className="font-bold">-{brl(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Frete</dt><dd className="font-bold text-grape">{order.shipping === 0 ? 'Grátis' : brl(order.shipping)}</dd></div>
            <div className="flex justify-between border-t border-pink-100 pt-3 text-base">
              <dt className="font-bold text-grape">Total</dt>
              <dd className="font-display text-xl font-extrabold text-grape">{brl(order.total)}</dd>
            </div>
          </dl>

          <p className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-pink-50 px-5 py-3 text-sm font-semibold text-grape">
            <IconTruck className="h-5 w-5 text-pink-600" />
            {order.status === 'pago'
              ? `Pagamento confirmado. As informações de envio serão atualizadas quando houver postagem.`
              : order.status === 'cancelado'
                ? 'Este pedido foi cancelado. Entre em contato com o atendimento se precisar de ajuda.'
                : 'Pedido pendente de confirmação de pagamento. Nenhum envio será iniciado até a confirmação.'}
          </p>

          {order.payment.last4 && (
            <p className="mt-3 text-xs text-ink-soft">
              Pagamento {viaMercadoPago ? 'processado pelo Mercado Pago' : 'registrado'} · {order.payment.brand} •••• {order.payment.last4}
              {order.payment.installments ? ` · ${order.payment.installments}x` : ''}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/catalogo" className="btn-portal px-8 py-3.5">Continuar comprando</Link>
            <Link to="/" className="btn-ghost px-8 py-3.5">Voltar ao início</Link>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Dúvidas? Fale com a gente no WhatsApp {settings.whatsapp} ou por {settings.email}.
      </p>
    </div>
  )
}
