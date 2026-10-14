import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { brl, cx, dateTimeBR } from '../../lib/format'
import type { OrderStatus } from '../../types'

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  pago: 'bg-blue-100 text-blue-700',
  enviado: 'bg-violet-100 text-violet-700',
  entregue: 'bg-pink-100 text-pink-700',
  cancelado: 'bg-red-100 text-red-600',
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
}

export default function Dashboard() {
  const { products, orders } = useStore()

  const paid = orders.filter((o) => o.status !== 'cancelado')
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const tickets = paid.length ? revenue / paid.length : 0
  const lowStock = products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 6)

  // Vendas dos últimos 7 dias
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
  const daily = days.map((d) => ({
    label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    value: paid
      .filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < new Date(d.getTime() + 86400000))
      .reduce((s, o) => s + o.total, 0),
  }))
  const maxDaily = Math.max(...daily.map((d) => d.value), 1)

  const kpis = [
    { label: 'Faturamento', value: brl(revenue), sub: `${paid.length} pedidos válidos`, accent: true },
    { label: 'Pedidos', value: String(orders.length), sub: `${orders.filter((o) => o.status === 'pendente').length} pendentes` },
    { label: 'Ticket médio', value: brl(tickets), sub: 'por pedido pago' },
    { label: 'Produtos ativos', value: String(products.length), sub: `${products.reduce((s, p) => s + p.stock, 0)} unidades em estoque` },
  ]

  return (
    <div className="space-y-8">
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <article key={k.label} className={cx('rounded-3xl border p-5', k.accent ? 'border-pink-300 bg-gradient-to-br from-pink-600 to-fuchsia-600 text-white' : 'border-pink-100 bg-white')}>
            <p className={cx('text-sm font-semibold', k.accent ? 'text-pink-100' : 'text-ink-soft')}>{k.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{k.value}</p>
            <p className={cx('mt-1 text-xs', k.accent ? 'text-pink-200' : 'text-ink-soft')}>{k.sub}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-label="Vendas dos últimos 7 dias" className="rounded-3xl border border-pink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-grape">Vendas — últimos 7 dias</h2>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label={`Gráfico de vendas: ${daily.map((d) => `${d.label} ${brl(d.value)}`).join(', ')}`}>
            {daily.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-ink-soft">{d.value > 0 ? brl(d.value).replace('R$', 'R$') : ''}</span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-pink-600 to-pink-400 transition-all duration-700"
                  style={{ height: `${Math.max(6, (d.value / maxDaily) * 140)}px` }}
                />
                <span className="text-xs font-semibold capitalize text-ink-soft">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Estoque baixo" className="rounded-3xl border border-pink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-grape">⚠️ Estoque baixo</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Todos os produtos com estoque saudável. 🎉</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold text-grape">{p.name}</span>
                  <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                    {p.stock} un.
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/produtos" className="mt-5 inline-block text-sm font-bold text-pink-700 hover:underline">Gerenciar estoque →</Link>
        </section>
      </div>

      <section aria-label="Pedidos recentes" className="rounded-3xl border border-pink-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-grape">Pedidos recentes</h2>
          <Link to="/admin/pedidos" className="text-sm font-bold text-pink-700 hover:underline">Ver todos →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhum pedido ainda. Faça um pedido na loja para vê-lo por aqui.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-ink-soft">
                  <th className="pb-3 pr-4">Pedido</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Pagamento</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-pink-50 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs font-bold text-grape">{o.id}<span className="block text-[10px] font-normal text-ink-soft">{dateTimeBR(o.createdAt)}</span></td>
                    <td className="py-3 pr-4 font-semibold text-grape">{o.customer.name}</td>
                    <td className="py-3 pr-4 capitalize text-ink-soft">{o.payment.method}{o.payment.last4 ? ` •••• ${o.payment.last4}` : ''}</td>
                    <td className="py-3 pr-4 font-bold text-grape">{brl(o.total)}</td>
                    <td className="py-3"><span className={cx('rounded-full px-2.5 py-1 text-xs font-bold', STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
