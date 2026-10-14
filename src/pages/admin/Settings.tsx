import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/useUI'
import Logo from '../../components/Logo'
import type { StoreSettings } from '../../types'
import { persistStoreState } from '../../lib/api'

export default function AdminSettings() {
  const { settings, updateSettings } = useStore()
  const toast = useUI((s) => s.toast)
  const [form, setForm] = useState<StoreSettings>(settings)
  useEffect(() => setForm(settings), [settings])

  const set = (key: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      ...form,
      freeShippingMin: Number(form.freeShippingMin) || 0,
      shippingFee: Number(form.shippingFee) || 0,
      pixDiscount: Math.min(50, Math.max(0, Number(form.pixDiscount) || 0)),
    })
    const synced = await persistStoreState(useStore.getState())
    toast(synced ? 'Configurações salvas no servidor ✅' : 'Alterações mantidas neste navegador, mas não sincronizadas. Verifique a API e a sessão administrativa.', synced ? 'success' : 'error')
  }

  const field = (key: keyof StoreSettings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-grape">{label}</span>
      <input
        value={String(form[key])}
        onChange={set(key)}
        className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white"
        {...props}
      />
    </label>
  )

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
      <form onSubmit={save} className="space-y-6 rounded-3xl border border-pink-100 bg-white p-6">
        <section>
          <h2 className="font-display text-lg font-bold text-grape">Identidade da loja</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('storeName', 'Nome da loja')}
            {field('whatsapp', 'WhatsApp de atendimento')}
            {field('email', 'E-mail de contato', { type: 'email' })}
            {field('address', 'Endereço da loja')}
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-bold text-grape">Faixa de anúncio (topo do site)</span>
            <input value={form.announcement} onChange={set('announcement')} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5 outline-none focus:border-pink-500 focus:bg-white" />
          </label>
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">Conteúdo da página inicial</h2>
          <p className="mt-1 text-sm text-ink-soft">Edite títulos, chamadas, cards e faixa animada sem alterar o código. Use {`{pix}`} e {`{frete}`} como variáveis de desconto e frete.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('heroBadge', 'Selo do topo')}
            {field('heroTitle', 'Título principal')}
            {field('heroHighlight', 'Palavra destacada')}
            {field('heroPrimaryCta', 'Botão principal')}
            {field('heroSecondaryCta', 'Botão secundário')}
            {field('promoBannerLabel', 'Rótulo do banner')}
            {field('promoBannerButton', 'Botão do banner')}
          </div>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Texto principal</span><textarea value={form.heroSubtitle} onChange={(e) => setForm((f) => ({ ...f, heroSubtitle: e.target.value }))} rows={3} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Faixa animada (separe itens com |)</span><textarea value={form.marqueeText} onChange={(e) => setForm((f) => ({ ...f, marqueeText: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('promoCard1Title', 'Card 1 — título')}{field('promoCard1Cta', 'Card 1 — botão')}
            {field('promoCard2Title', 'Card 2 — título')}{field('promoCard2Cta', 'Card 2 — botão')}
            {field('promoCard3Title', 'Card 3 — título')}{field('promoCard3Cta', 'Card 3 — botão')}
          </div>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Card 1 — texto</span><textarea value={form.promoCard1Text} onChange={(e) => setForm((f) => ({ ...f, promoCard1Text: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Card 2 — texto</span><textarea value={form.promoCard2Text} onChange={(e) => setForm((f) => ({ ...f, promoCard2Text: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Card 3 — texto</span><textarea value={form.promoCard3Text} onChange={(e) => setForm((f) => ({ ...f, promoCard3Text: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Título do banner promocional</span><textarea value={form.promoBannerTitle} onChange={(e) => setForm((f) => ({ ...f, promoBannerTitle: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Texto do banner promocional</span><textarea value={form.promoBannerDescription} onChange={(e) => setForm((f) => ({ ...f, promoBannerDescription: e.target.value }))} rows={3} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">Cards de diferenciais</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('feature1Title', 'Card 1 — título')}{field('feature2Title', 'Card 2 — título')}
            {field('feature3Title', 'Card 3 — título')}{field('feature4Title', 'Card 4 — título')}
          </div>
          {(['feature1Text','feature2Text','feature3Text','feature4Text'] as const).map((key, index) => <label key={key} className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">Card {index + 1} — texto</span><textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>)}
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">Frete e descontos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {field('freeShippingMin', 'Frete grátis a partir de (R$)', { type: 'number', min: '0' })}
            {field('shippingFee', 'Valor do frete (R$)', { type: 'number', step: '0.01', min: '0' })}
            {field('pixDiscount', 'Desconto Pix (%)', { type: 'number', min: '0', max: '50' })}
          </div>
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">SEO, títulos de seção e rodapé</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('seoTitle', 'Título SEO')}{field('categoryTitle', 'Título da seção de categorias')}
            {field('categoryCta', 'Botão das categorias')}{field('featuredTitle', 'Título dos destaques')}
            {field('featuredCta', 'Botão dos destaques')}{field('promoSectionTitle', 'Título das promoções')}
            {field('footerCopyright', 'Texto legal do rodapé')}
          </div>
          {(['seoDescription','categoryDescription','featuredDescription','promoSectionDescription','footerDescription','footerHelpShipping','footerHelpReturns','footerHelpPayment'] as const).map((key) => <label key={key} className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">{({seoDescription:'Descrição SEO',categoryDescription:'Descrição das categorias',featuredDescription:'Descrição dos destaques',promoSectionDescription:'Descrição das promoções',footerDescription:'Descrição da loja no rodapé',footerHelpShipping:'Rodapé — entrega',footerHelpReturns:'Rodapé — trocas',footerHelpPayment:'Rodapé — pagamento'} as Record<string,string>)[key]}</span><textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={2} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>)}
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">Políticas exibidas ao cliente</h2>
          {(['shippingPolicy','returnsPolicy','paymentPolicy'] as const).map((key) => <label key={key} className="mt-4 block"><span className="mb-1.5 block text-sm font-bold text-grape">{key === 'shippingPolicy' ? 'Entrega e frete' : key === 'returnsPolicy' ? 'Trocas e devoluções' : 'Pagamentos'}</span><textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={3} className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-2.5" /></label>)}
        </section>

        <section className="border-t border-pink-100 pt-6">
          <h2 className="font-display text-lg font-bold text-grape">Segurança</h2>
          <div className="mt-3 rounded-2xl bg-pink-50 p-4 text-xs leading-relaxed text-ink-soft">
            <p>
              O acesso é validado pelo Worker. A sessão usa cookie <strong className="text-grape">HttpOnly</strong>, assinatura HMAC, expiração e registro no D1; a senha é derivada com PBKDF2 e salt aleatório.
            </p>
            <p className="mt-2">
              O primeiro acesso usa a senha temporária <strong className="text-grape">123456</strong> e exige troca por uma senha forte. Nunca compartilhe a senha temporária e configure <code className="font-mono text-pink-700">ADMIN_SESSION_SECRET</code> como secret no Worker.
            </p>
          </div>
        </section>

        <div className="flex justify-end border-t border-pink-100 pt-5">
          <button type="submit" className="btn-portal px-8 py-3.5">Salvar alterações</button>
        </div>
      </form>

      <aside className="space-y-4 self-start rounded-3xl border border-pink-100 bg-white p-6">
        <Logo className="h-24 w-24" compact />
        <h2 className="font-display font-bold text-grape">Dados da loja</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          O catálogo e as configurações são sincronizados com o D1 quando a API está configurada e a sessão administrativa está ativa. O modo local serve apenas como fallback de desenvolvimento.
        </p>
        <p className="rounded-2xl bg-pink-50 p-3 text-xs leading-relaxed text-ink-soft">
          Pagamentos: {import.meta.env.VITE_MP_PUBLIC_KEY && import.meta.env.VITE_MP_API_URL
            ? 'Mercado Pago conectado ✅'
            : 'Mercado Pago não configurado — checkout em modo demonstração.'}
        </p>

      </aside>
    </div>
  )
}
