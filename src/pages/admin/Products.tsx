import { useMemo, useState } from 'react'
import { persistStoreState } from '../../lib/api'
import { useUI } from '../../store/useUI'
import { useStore } from '../../store/useStore'
import ProductArt from '../../components/ProductArt'
import { IconClose, IconPlus, IconSearch, IconTrash } from '../../components/Icons'
import { brl, cx } from '../../lib/format'
import { CATEGORIES } from '../../data/products'
import { artIds } from '../../components/ProductArt'
import type { Category, Product } from '../../types'

const emptyProduct = (): Product => ({
  id: `p${Date.now().toString(36)}`,
  slug: '',
  name: '',
  category: 'Roupas',
  price: 0,
  rating: 5,
  reviews: 0,
  stock: 0,
  sales: 0,
  art: artIds[0],
  tagline: '',
  description: '',
  highlights: [],
  variants: { label: 'Tamanho', options: ['Único'] },
  createdAt: new Date().toISOString(),
})

export default function AdminProducts() {
  const { products, upsertProduct, deleteProduct, adjustStock } = useStore()
  const toast = useUI((s) => s.toast)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : products
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [products, query])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const slug = editing.slug || editing.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    upsertProduct({ ...editing, slug, price: Number(editing.price) || 0, stock: Number(editing.stock) || 0 })
    const synced = await persistStoreState(useStore.getState())
    toast(synced ? 'Produto salvo no servidor.' : 'Produto salvo apenas neste navegador; verifique a conexão e a sessão administrativa.', synced ? 'success' : 'error')
    setEditing(null)
  }

  const changeStock = async (id: string, delta: number) => {
    adjustStock(id, delta)
    const synced = await persistStoreState(useStore.getState())
    toast(synced ? 'Estoque atualizado.' : 'Estoque alterado localmente, mas não sincronizado.', synced ? 'success' : 'error')
  }

  const removeProduct = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return
    deleteProduct(id)
    const synced = await persistStoreState(useStore.getState())
    toast(synced ? 'Produto removido.' : 'Produto removido localmente, mas não sincronizado.', synced ? 'success' : 'error')
  }

  const field = <K extends keyof Product>(key: K, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-grape">{label}</span>
      <input
        value={String(editing?.[key] ?? '')}
        onChange={(e) => setEditing((p) => (p ? { ...p, [key]: e.target.value } : p))}
        className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white"
        {...props}
      />
    </label>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto…"
            aria-label="Buscar produto"
            className="w-full rounded-full border border-pink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-pink-500"
          />
        </div>
        <button
          onClick={() => { setEditing(emptyProduct()); setIsNew(true) }}
          className="btn-portal px-6 py-3 text-sm"
        >
          <IconPlus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-pink-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-pink-50 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3.5">Produto</th>
                <th className="px-5 py-3.5">Categoria</th>
                <th className="px-5 py-3.5">Preço</th>
                <th className="px-5 py-3.5">Estoque</th>
                <th className="px-5 py-3.5">Vendas</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-pink-50 hover:bg-pink-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ProductArt art={p.art} imageUrl={p.imageUrl} mediaType={p.mediaType} className="h-11 w-11 rounded-xl" />
                      <div>
                        <p className="font-bold text-grape">{p.name}</p>
                        <p className="text-xs text-ink-soft">{p.tagline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.category}</td>
                  <td className="px-5 py-3 font-bold text-grape">{brl(p.price)}</td>
                  <td className="px-5 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => void changeStock(p.id, -1)} aria-label={`Diminuir estoque de ${p.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-pink-200 font-bold text-pink-700 hover:bg-pink-100">−</button>
                      <span className={cx('min-w-8 text-center font-bold', p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-600' : 'text-grape')}>{p.stock}</span>
                      <button onClick={() => void changeStock(p.id, 1)} aria-label={`Aumentar estoque de ${p.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-pink-200 font-bold text-pink-700 hover:bg-pink-100">+</button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.sales}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing({ ...p }); setIsNew(false) }} className="rounded-full bg-pink-100 px-4 py-1.5 text-xs font-bold text-pink-700 hover:bg-pink-200">
                        Editar
                      </button>
                      <button
                        onClick={() => void removeProduct(p.id, p.name)}
                        aria-label={`Excluir ${p.name}`}
                        className="rounded-full p-1.5 text-red-400 hover:bg-red-50"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-grape/60 p-4 backdrop-blur-sm animate-fade" role="dialog" aria-modal="true" aria-label={isNew ? 'Novo produto' : 'Editar produto'}>
          <form onSubmit={save} className="max-h-[88vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl bg-white p-6 shadow-float animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-grape">{isNew ? 'Novo produto' : 'Editar produto'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Fechar" className="rounded-full p-2 hover:bg-pink-100"><IconClose /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field('name', 'Nome', { required: true })}
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-grape">Categoria</span>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing((p) => (p ? { ...p, category: e.target.value as Category } : p))}
                  className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {field('price', 'Preço (R$)', { type: 'number', step: '0.01', min: '0' })}
              {field('oldPrice', 'Preço antigo (R$)', { type: 'number', step: '0.01', min: '0' })}
              {field('stock', 'Estoque', { type: 'number', min: '0' })}
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-grape">Ilustração</span>
                <select
                  value={editing.art}
                  onChange={(e) => setEditing((p) => (p ? { ...p, art: e.target.value } : p))}
                  className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500"
                >
                  {artIds.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              {field('tagline', 'Chamada curta')}
              {field('imageUrl', 'Link da mídia do produto (opcional)', { type: 'url', placeholder: 'https://site.com/produto.jpg' })}
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-grape">Tipo de mídia</span>
                <select value={editing.mediaType || 'image'} onChange={(e) => setEditing((p) => p ? { ...p, mediaType: e.target.value as Product['mediaType'] } : p)} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500">
                  <option value="image">Imagem (JPG, PNG, WebP, AVIF)</option>
                  <option value="gif">GIF animado</option>
                  <option value="video">Vídeo (MP4, WebM, MOV)</option>
                </select>
              </label>
            </div>
            <div className="rounded-2xl border border-dashed border-pink-300 bg-pink-50 p-4">
              <p className="text-sm font-bold text-grape">Pré-visualização da mídia</p>
              <p className="mt-1 text-xs text-ink-soft">Cole um link HTTPS público da imagem, GIF ou vídeo. O arquivo fica hospedado no serviço de origem; a KOMBINE apenas salva e exibe o link, sem upload ou armazenamento em R2.</p>
              {editing.imageUrl && /^https:\/\//i.test(editing.imageUrl) ? <ProductArt art={editing.art} imageUrl={editing.imageUrl} mediaType={editing.mediaType} className="mt-3 h-36 max-w-full rounded-xl object-cover" /> : <p className="mt-3 text-xs text-ink-soft">Adicione um link HTTPS para visualizar a mídia aqui.</p>}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-grape">Descrição</span>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing((p) => (p ? { ...p, description: e.target.value } : p))}
                rows={3}
                className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-grape">Destaques (um por linha)</span>
                <textarea
                  value={editing.highlights.join('\n')}
                  onChange={(e) => setEditing((p) => (p ? { ...p, highlights: e.target.value.split('\n').filter(Boolean) } : p))}
                  rows={3}
                  className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-grape">Opções de {editing.variants.label.toLowerCase()} (separadas por vírgula)</span>
                <input
                  value={editing.variants.options.join(', ')}
                  onChange={(e) => setEditing((p) => (p ? { ...p, variants: { ...p.variants, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } } : p))}
                  className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white"
                />
                <span className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
                  Rótulo:
                  <input
                    value={editing.variants.label}
                    onChange={(e) => setEditing((p) => (p ? { ...p, variants: { ...p.variants, label: e.target.value } } : p))}
                    className="rounded-lg border border-pink-200 px-2 py-1 text-xs outline-none focus:border-pink-500"
                  />
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-grape">
                <input type="checkbox" checked={Boolean(editing.promo)} onChange={(e) => setEditing((p) => (p ? { ...p, promo: e.target.checked } : p))} className="h-4 w-4 accent-pink-600" />
                Em promoção
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-grape">
                <input type="checkbox" checked={Boolean(editing.bestseller)} onChange={(e) => setEditing((p) => (p ? { ...p, bestseller: e.target.checked } : p))} className="h-4 w-4 accent-pink-600" />
                Mais vendido
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-pink-100 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost px-6 py-3 text-sm">Cancelar</button>
              <button type="submit" className="btn-portal px-8 py-3 text-sm">Salvar produto</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
