import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { brl, cx } from '../../lib/format'
import { CATEGORIES } from '../../data/products'

const METHOD_LABEL: Record<string, string> = { pix: 'Pix', credito: 'Crédito', debito: 'Débito' }

export default function AdminSales() {
  const { orders, products } = useStore()

  const valid = useMemo(() => orders.filter((o) => o.status !== 'cancelado'), [orders])

  const revenue = valid.reduce((s, o) => s + o.total, 0)
  const byMethod = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = { pix: { total: 0, count: 0 }, credito: { total: 0, count: 0 }, debito: { total: 0, count: 0 } }
    valid.forEach((o) => {
      const m = map[o.payment.method]
      if (m) { m.total += o.total; m.count += 1 }
    })
    return map
  }, [valid])

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    CATEGORIES.forEach((c) => (map[c] = 0))
    valid.forEach((o) => {
      o.items.forEach((it) => {
        const cat = products.find((p) => p.id === it.productId)?.category
        if (cat) map[cat] += it.price * it.qty
      })
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [valid, products])

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {}
    valid.forEach((o) =>
      o.items.forEach((it) => {
        const entry = (map[it.productId] ??= { name: it.name, qty: 0, total: 0 })
        entry.qty += it.qty
        entry.total += it.price * it.qty
      }),
    )
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [valid])

  const maxCat = Math.max(...byCategory.map(([, v]) => v), 1)
  const maxMethod = Math.max(...Object.values(byMethod).map((m) => m.total), 1)

  return (
    <div className="space-y-8">
      <section aria-label="Resumo de vendas" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Faturamento total', value: brl(revenue) },
          { label: 'Pedidos válidos', value: String(valid.length) },
          { label: 'Ticket médio', value: brl(valid.length ? revenue / valid.length : 0) },
        ].map((k) => (
          <article key={k.label} className="rounded-3xl border border-pink-100 bg-white p-5">
            <p className="text-sm font-semibold text-ink-soft">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-grape">{k.value}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Vendas por forma de pagamento" className="rounded-3xl border border-pink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-grape">Por forma de pagamento</h2>
          <div className="mt-5 space-y-4">
            {Object.entries(byMethod).map(([method, data]) => (
              <div key={method}>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-grape">{METHOD_LABEL[method]} <span className="font-normal text-ink-soft">({data.count} pedidos)</span></span>
                  <span className="font-bold text-grape">{brl(data.total)}</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-700 transition-all duration-700"
                    style={{ width: `${(data.total / maxMethod) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Vendas por categoria" className="rounded-3xl border border-pink-100 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-grape">Por categoria</h2>
          <div className="mt-5 space-y-3">
            {byCategory.map(([cat, value]) => (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-bold text-grape">{cat}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-pink-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-600 transition-all duration-700" style={{ width: `${(value / maxCat) * 100}%` }} />
                </div>
                <span className={cx('w-24 shrink-0 text-right font-bold', value === 0 ? 'text-ink-soft' : 'text-grape')}>{brl(value)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section aria-label="Produtos mais vendidos" className="rounded-3xl border border-pink-100 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-grape">Produtos mais vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Ainda não há vendas registradas. Faça um pedido de teste na loja! 🛍️</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-600 font-display text-sm font-bold text-white">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-grape">{p.name}</span>
                <span className="text-sm text-ink-soft">{p.qty} un.</span>
                <span className="font-display font-bold text-grape">{brl(p.total)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
