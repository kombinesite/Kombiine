import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import ProductArt from '../../components/ProductArt'
import { brl, cx, dateTimeBR } from '../../lib/format'
import type { OrderStatus } from '../../types'
import { STATUS_LABEL, STATUS_STYLE } from './Dashboard'

const FILTERS: Array<{ value: OrderStatus | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'pago', label: 'Pagos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'entregue', label: 'Entregues' },
  { value: 'cancelado', label: 'Cancelados' },
]

export default function AdminOrders() {
  const { orders, setOrderStatus } = useStore()
  const [filter, setFilter] = useState<OrderStatus | 'todos'>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === 'todos' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar pedidos por status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cx(
              'rounded-full px-4 py-2 text-sm font-bold transition',
              filter === f.value ? 'bg-pink-600 text-white shadow-portal' : 'border border-pink-200 bg-white text-grape hover:border-pink-400',
            )}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">
              {f.value === 'todos' ? orders.length : orders.filter((o) => o.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-pink-100 bg-white py-16 text-center">
          <p className="text-4xl" aria-hidden="true">📦</p>
          <p className="mt-3 font-display font-bold text-grape">Nenhum pedido nesta categoria</p>
          <p className="mt-1 text-sm text-ink-soft">Quando os pedidos chegarem, eles aparecem aqui.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => {
            const open = expanded === o.id
            return (
              <li key={o.id} className="overflow-hidden rounded-3xl border border-pink-100 bg-white">
                <button
                  onClick={() => setExpanded(open ? null : o.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-pink-50/50"
                >
                  <span className="font-mono text-sm font-bold text-grape">{o.id}</span>
                  <span className="text-sm text-ink-soft">{dateTimeBR(o.createdAt)}</span>
                  <span className="text-sm font-semibold text-grape">{o.customer.name}</span>
                  <span className="ml-auto font-display text-lg font-extrabold text-grape">{brl(o.total)}</span>
                  <span className={cx('rounded-full px-3 py-1 text-xs font-bold', STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span>
                  <span className={cx('text-pink-500 transition', open && 'rotate-90')} aria-hidden="true">›</span>
                </button>

                {open && (
                  <div className="grid gap-6 border-t border-pink-100 bg-pink-50/40 px-5 py-5 lg:grid-cols-2 animate-slide-up">
                    <div>
                      <h3 className="text-sm font-bold text-grape">Itens</h3>
                      <ul className="mt-3 space-y-2.5">
                        {o.items.map((it) => (
                          <li key={`${it.productId}-${it.variant}`} className="flex items-center gap-3 rounded-2xl bg-white p-2.5">
                            <ProductArt art={it.art} imageUrl={it.imageUrl} mediaType={it.mediaType} className="h-11 w-11 rounded-lg" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-grape">{it.name}</p>
                              <p className="text-xs text-ink-soft">{it.variant} · {it.qty}x {brl(it.price)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-bold text-grape">{brl(o.subtotal)}</dd></div>
                        {o.discount > 0 && <div className="flex justify-between text-pink-700"><dt>Descontos</dt><dd className="font-bold">-{brl(o.discount)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-ink-soft">Frete</dt><dd className="font-bold text-grape">{o.shipping === 0 ? 'Grátis' : brl(o.shipping)}</dd></div>
                        <div className="flex justify-between border-t border-pink-100 pt-1"><dt className="font-bold text-grape">Total</dt><dd className="font-display font-extrabold text-grape">{brl(o.total)}</dd></div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-grape">Cliente e entrega</h3>
                      <address className="mt-3 not-italic text-sm leading-relaxed text-ink-soft">
                        <strong className="text-grape">{o.customer.name}</strong><br />
                        {o.customer.email} · {o.customer.phone}<br />
                        CPF {o.customer.cpf}<br />
                        {o.customer.address}, {o.customer.number} {o.customer.complement && `— ${o.customer.complement}`}<br />
                        {o.customer.neighborhood} · {o.customer.city}/{o.customer.state} · CEP {o.customer.zip}
                      </address>

                      <h3 className="mt-5 text-sm font-bold text-grape">Pagamento</h3>
                      <p className="mt-1.5 text-sm capitalize text-ink-soft">
                        {o.payment.method === 'pix' ? 'Pix' : `${o.payment.brand ?? 'Cartão'} ${o.payment.method}`}
                        {o.payment.last4 ? ` •••• ${o.payment.last4}` : ''}
                        {o.payment.installments ? ` · ${o.payment.installments}x sem juros` : ''}
                        {o.payment.gateway === 'mercadopago' && o.payment.paymentId ? ` · MP #${o.payment.paymentId}` : ''}
                      </p>

                      <h3 className="mt-5 text-sm font-bold text-grape">Atualizar status</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {((o.status === 'pendente' ? ['pago', 'cancelado'] : o.status === 'pago' ? ['enviado', 'cancelado'] : o.status === 'enviado' ? ['entregue'] : []) as OrderStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setOrderStatus(o.id, s)}
                            aria-pressed={o.status === s}
                            className={cx(
                              'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                              o.status === s ? 'bg-grape text-white' : 'border border-pink-200 bg-white text-grape hover:border-pink-400',
                            )}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
