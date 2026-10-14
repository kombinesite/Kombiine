import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../store/useCart'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { useSeo } from '../lib/seo'
import ProductArt from '../components/ProductArt'
import { IconCard, IconCheck, IconClose, IconPix, IconShield } from '../components/Icons'
import { brl, cx, formatCard, formatCep, formatCpf, formatPhone, onlyDigits } from '../lib/format'
import { detectBrand, expiryValid, formatExpiry, luhn } from '../lib/card'
import {
  createCardToken,
  getPaymentStatus,
  isMercadoPagoConfigured,
  payWithCard,
  payWithPix,
  type PaymentResult,
} from '../lib/mercadopago'
import type { Order, PaymentMethod } from '../types'
import { apiUrl } from '../lib/api'

type Step = 1 | 2 | 3

const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface FormData {
  name: string; email: string; phone: string; cpf: string
  zip: string; address: string; number: string; complement: string
  neighborhood: string; city: string; state: string
}

const EMPTY: FormData = { name: '', email: '', phone: '', cpf: '', zip: '', address: '', number: '', complement: '', neighborhood: '', city: '', state: '' }

export default function Checkout() {
  useSeo('Finalização do pedido — KOMBINE', 'Revise os dados do pedido e as opções de pagamento disponíveis.')
  const { items, coupon, clear } = useCart()
  const products = useStore((s) => s.products)
  const settings = useStore((s) => s.settings)
  const placeOrder = useStore((s) => s.placeOrder)
  const toast = useUI((s) => s.toast)
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '', installments: 1 })
  const [processing, setProcessing] = useState(false)
  const [serverOrderId, setServerOrderId] = useState<string | null>(null)
  const [serverOrderTotal, setServerOrderTotal] = useState<number | null>(null)
  const cardRef = useRef<HTMLInputElement>(null)

  // Mercado Pago: quando as chaves estão preenchidas, o pagamento é real.
  const mpReady = isMercadoPagoConfigured()
  const [pixCharge, setPixCharge] = useState<PaymentResult | null>(null)
  const [pixPaid, setPixPaid] = useState(false)
  const [pixLoading, setPixLoading] = useState(false)
  const [payError, setPayError] = useState('')

  const lines = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId)
      return product ? { item: i, product } : null
    })
    .filter(Boolean) as Array<{ item: typeof items[number]; product: typeof products[number] }>

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0)
  const couponPct = coupon === 'KOMBINE10' ? 10 : coupon === 'BEMVINDA' ? 15 : coupon === 'ROSA20' ? 20 : 0
  const couponDiscount = (subtotal * couponPct) / 100
  const pixDiscount = method === 'pix' ? (subtotal * settings.pixDiscount) / 100 : 0
  const shipping = subtotal >= settings.freeShippingMin ? 0 : settings.shippingFee
  const total = Math.max(0, subtotal - couponDiscount - pixDiscount + shipping)

  const brand = detectBrand(onlyDigits(card.number))

  // Lookup de CEP (ViaCEP) com fallback silencioso
  useEffect(() => {
    const cep = onlyDigits(form.zip)
    if (cep.length !== 8) return
    const t = setTimeout(() => {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.erro) {
            setForm((f) => ({ ...f, address: d.logradouro || f.address, neighborhood: d.bairro || f.neighborhood, city: d.localidade || f.city, state: d.uf || f.state }))
          }
        })
        .catch(() => undefined)
    }, 450)
    return () => clearTimeout(t)
  }, [form.zip])

  useEffect(() => {
    if (method === 'credito' || method === 'debito') cardRef.current?.focus()
  }, [method])

  // Polling do Pix até o Mercado Pago confirmar o pagamento
  useEffect(() => {
    if (!pixCharge || pixPaid || !mpReady) return
    const id = setInterval(async () => {
      try {
        const result = await getPaymentStatus(pixCharge.id)
        if (result.status === 'approved') {
          setPixPaid(true)
          toast('Pix confirmado! Pagamento aprovado 🎉')
        }
      } catch {
        /* mantém o polling silencioso em caso de oscilação de rede */
      }
    }, 5000)
    return () => clearInterval(id)
  }, [pixCharge, pixPaid, mpReady, toast])

  if (items.length === 0 && !processing) return <Navigate to="/carrinho" replace />

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value
    const value =
      key === 'phone' ? formatPhone(raw) : key === 'cpf' ? formatCpf(raw) : key === 'zip' ? formatCep(raw) : raw
    setForm((f) => ({ ...f, [key]: value }))
  }

  const validateStep1 = () => {
    const err: Record<string, string> = {}
    if (form.name.trim().length < 3) err.name = 'Informe seu nome completo'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = 'E-mail inválido'
    if (onlyDigits(form.phone).length < 10) err.phone = 'Telefone com DDD'
    if (onlyDigits(form.cpf).length !== 11) err.cpf = 'CPF com 11 dígitos'
    if (onlyDigits(form.zip).length !== 8) err.zip = 'CEP com 8 dígitos'
    if (!form.address.trim()) err.address = 'Informe o endereço'
    if (!form.number.trim()) err.number = 'Número'
    if (!form.neighborhood.trim()) err.neighborhood = 'Bairro'
    if (!form.city.trim()) err.city = 'Cidade'
    if (!form.state) err.state = 'UF'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const validateStep2 = () => {
    if (method === 'pix') return true
    const err: Record<string, string> = {}
    if (!luhn(onlyDigits(card.number))) err.number = 'Número de cartão inválido'
    if (card.name.trim().length < 3) err.cardName = 'Nome impresso no cartão'
    if (!expiryValid(card.expiry)) err.expiry = 'Validade MM/AA'
    if (onlyDigits(card.cvv).length < 3) err.cvv = 'CVV inválido'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const createServerOrder = async (paymentMethod: PaymentMethod) => {
    const response = await fetch(apiUrl('/api/orders'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { ...form, cpf: onlyDigits(form.cpf), phone: onlyDigits(form.phone), zip: onlyDigits(form.zip) },
        items: lines.map((line) => ({ productId: line.product.id, qty: line.item.qty, variant: line.item.variant })),
        method: paymentMethod, coupon,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Não foi possível registrar o pedido no servidor.')
    if (typeof data.id !== 'string' || !(Number(data.total) > 0)) throw new Error('Resposta inválida ao registrar pedido.')
    setServerOrderId(data.id); setServerOrderTotal(Number(data.total))
    return { id: data.id as string, total: Number(data.total) }
  }

  /** Gera a cobrança Pix oficial (QR + copia-e-cola) vinculada a um pedido persistido. */
  const generatePix = async () => {
    setPayError('')
    setPixLoading(true)
    try {
      const serverOrder = await createServerOrder('pix')
      const charge = await payWithPix({
        orderId: serverOrder.id,
        amount: serverOrder.total,
        method: 'pix',
        description: `Pedido KOMBINE — ${lines.length} ${lines.length === 1 ? 'item' : 'itens'}`,
        payer: {
          email: form.email,
          name: form.name,
          identification: { type: 'CPF', number: onlyDigits(form.cpf) },
        },
      })
      setPixCharge(charge)
      toast('QR Code Pix gerado pelo Mercado Pago 🟣')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao gerar o Pix.'
      setPayError(message)
      toast(message, 'error')
    } finally {
      setPixLoading(false)
    }
  }

  const buildOrder = (status: Order['status'], payment: Order['payment'], id = serverOrderId ?? `KMB-${Date.now().toString(36).toUpperCase().slice(-6)}`, totalOverride?: number): Order => ({
    id,
    createdAt: new Date().toISOString(),
    customer: form,
    items: lines.map((l) => ({
      productId: l.product.id, qty: l.item.qty, variant: l.item.variant,
      name: l.product.name, price: l.product.price, art: l.product.art, imageUrl: l.product.imageUrl, mediaType: l.product.mediaType,
    })),
    payment,
    subtotal, discount: couponDiscount + pixDiscount, shipping, total: totalOverride ?? serverOrderTotal ?? total,
    status,
  })

  /** Finaliza: pagamento real via Mercado Pago quando configurado. */
  const confirm = async () => {
    if (processing) return
    setPayError('')
    setProcessing(true)

    if (!mpReady && (method === 'credito' || method === 'debito')) {
      const message = 'Cartões não podem ser processados em modo demonstração. Configure o Mercado Pago ou selecione Pix para registrar um pedido de teste pendente.'
      setPayError(message); toast(message, 'error'); setProcessing(false); return
    }

    if (mpReady && (method === 'credito' || method === 'debito')) {
      try {
        // Cria o pedido no servidor; o Worker valida valor e método contra esse registro.
        const serverOrder = await createServerOrder(method)
        // 1) tokeniza o cartão no navegador com a Public Key
        const token = await createCardToken({
          number: onlyDigits(card.number),
          name: card.name || form.name,
          expiry: card.expiry,
          cvv: onlyDigits(card.cvv),
          docType: 'CPF',
          docNumber: onlyDigits(form.cpf),
        })
        // 2) cria o pagamento no backend com o Access Token
        const result = await payWithCard({
          orderId: serverOrder.id,
          amount: serverOrder.total,
          method,
          description: `Pedido KOMBINE — ${lines.length} ${lines.length === 1 ? 'item' : 'itens'}`,
          payer: {
            email: form.email,
            name: form.name,
            identification: { type: 'CPF', number: onlyDigits(form.cpf) },
          },
          token,
          paymentMethodId: (brand ?? 'visa').toLowerCase(),
          installments: method === 'credito' ? card.installments : 1,
        })

        if (result.status !== 'approved' && result.status !== 'in_process') {
          throw new Error(result.statusDetail ?? 'Pagamento recusado pela operadora. Tente outro cartão.')
        }

        const order = buildOrder(result.status === 'approved' ? 'pago' : 'pendente', {
          method,
          installments: method === 'credito' ? card.installments : undefined,
          last4: result.last4 ?? onlyDigits(card.number).slice(-4),
          brand: result.brand ?? brand ?? undefined,
          paymentId: String(result.id),
          gateway: 'mercadopago',
        }, serverOrder.id, serverOrder.total)
        placeOrder(order)
        clear()
        toast(result.status === 'approved' ? 'Pagamento aprovado! Bem-vindo à família KOMBINE 🎉' : 'Pagamento em análise. O pedido ficará pendente até a confirmação.', result.status === 'approved' ? 'success' : 'info')
        navigate(`/pedido/${order.id}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível processar o pagamento.'
        setPayError(message)
        toast(message, 'error')
        setProcessing(false)
      }
      return
    }

    if (mpReady && method === 'pix') {
      const order = buildOrder(pixPaid ? 'pago' : 'pendente', {
        method: 'pix',
        gateway: pixCharge ? 'mercadopago' : 'demo',
        paymentId: pixCharge ? String(pixCharge.id) : undefined,
        pixQrCode: pixCharge?.pix?.qrCode,
      })
      placeOrder(order)
      clear()
      toast(pixPaid ? 'Pix confirmado! Pedido aprovado 🎉' : 'Pedido criado — finalize o Pix para liberar o envio 💜')
      navigate(`/pedido/${order.id}`)
      return
    }

    // Modo demonstração (sem chaves configuradas): simula autorização antifraude + adquirente
    setTimeout(() => {
      const order: Order = {
        id: `KMB-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        createdAt: new Date().toISOString(),
        customer: form,
        items: lines.map((l) => ({
          productId: l.product.id, qty: l.item.qty, variant: l.item.variant,
          name: l.product.name, price: l.product.price, art: l.product.art, imageUrl: l.product.imageUrl, mediaType: l.product.mediaType,
        })),
        payment: {
          method,
          installments: method === 'credito' ? card.installments : undefined,
          last4: onlyDigits(card.number).slice(-4) || undefined,
          brand: method === 'pix' ? undefined : brand ?? undefined,
          gateway: 'demo',
        },
        subtotal, discount: couponDiscount + pixDiscount, shipping, total,
        status: 'pendente',
      }
      placeOrder(order)
      clear()
      toast('Pedido de demonstração registrado como pendente. Nenhum pagamento real foi processado.', 'info')
      navigate(`/pedido/${order.id}`)
    }, 1600)
  }

  const field = (
    id: keyof FormData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = false,
  ) => (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-grape">{label}</label>
      <input
        id={id}
        value={form[id]}
        onChange={set(id)}
        aria-invalid={Boolean(errors[id])}
        aria-describedby={errors[id] ? `${id}-erro` : undefined}
        className={cx(
          'w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 text-[15px] outline-none transition focus:bg-white',
          errors[id] ? 'border-red-400' : 'border-pink-200 focus:border-pink-500',
        )}
        {...props}
      />
      {errors[id] && <p id={`${id}-erro`} className="mt-1 text-xs font-semibold text-red-500">{errors[id]}</p>}
    </div>
  )

  const stepBadge = (n: Step, label: string) => (
    <li className="flex items-center gap-2.5" aria-current={step === n ? 'step' : undefined}>
      <span
        data-active={step === n}
        className="step-dot grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-100 font-display text-sm font-bold text-pink-700 transition"
      >
        {step > n ? <IconCheck className="h-4 w-4" /> : n}
      </span>
      <span className={cx('text-sm font-bold', step >= n ? 'text-grape' : 'text-ink-soft')}>{label}</span>
    </li>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold text-grape">Checkout</h1>
      <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
        <IconShield className="h-4 w-4 text-pink-600" /> Revise os dados antes de confirmar · pagamentos reais dependem da configuração do gateway
      </p>

      <ol className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-pink-100 pb-5">
        {stepBadge(1, 'Dados e entrega')}
        <li aria-hidden="true" className="hidden h-px w-10 bg-pink-200 sm:block" />
        {stepBadge(2, 'Pagamento')}
        <li aria-hidden="true" className="hidden h-px w-10 bg-pink-200 sm:block" />
        {stepBadge(3, 'Revisão')}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {/* ETAPA 1 */}
          {step === 1 && (
            <section aria-label="Dados pessoais e entrega" className="card-premium p-6 animate-slide-up">
              <h2 className="font-display text-lg font-bold text-grape">Para onde enviamos?</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {field('name', 'Nome completo', { autoComplete: 'name', placeholder: 'Maria da Silva' }, true)}
                {field('email', 'E-mail', { type: 'email', autoComplete: 'email', placeholder: 'maria@email.com' })}
                {field('phone', 'Celular (WhatsApp)', { inputMode: 'tel', value: form.phone, placeholder: '(11) 99876-5432' })}
                {field('cpf', 'CPF', { inputMode: 'numeric', placeholder: '000.000.000-00' })}
                {field('zip', 'CEP', { inputMode: 'numeric', placeholder: '05432-000' })}
                {field('address', 'Rua / Avenida', { autoComplete: 'address-line1' }, true)}
                {field('number', 'Número')}
                {field('complement', 'Complemento (opcional)', { placeholder: 'Apto, bloco…' })}
                {field('neighborhood', 'Bairro')}
                {field('city', 'Cidade')}
                <div className="sm:col-span-2">
                  <label htmlFor="state" className="mb-1.5 block text-sm font-bold text-grape">Estado (UF)</label>
                  <select
                    id="state"
                    value={form.state}
                    onChange={set('state')}
                    aria-invalid={Boolean(errors.state)}
                    className={cx('w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 outline-none focus:bg-white', errors.state ? 'border-red-400' : 'border-pink-200 focus:border-pink-500')}
                  >
                    <option value="">Selecione</option>
                    {UF.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  {errors.state && <p className="mt-1 text-xs font-semibold text-red-500">{errors.state}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => { if (validateStep1()) setStep(2) }}
                  className="btn-portal px-8 py-3.5"
                >
                  Ir para pagamento
                </button>
              </div>
            </section>
          )}

          {/* ETAPA 2 */}
          {step === 2 && (
            <section aria-label="Pagamento" className="space-y-5 animate-slide-up">
              <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de pagamento">
                {([
                  { id: 'pix', label: 'Pix', desc: `${settings.pixDiscount}% OFF`, icon: <IconPix className="h-6 w-6" /> },
                  { id: 'credito', label: 'Crédito', desc: mpReady ? 'Parcelamento no gateway' : 'Configure o Mercado Pago', icon: <IconCard className="h-6 w-6" /> },
                  { id: 'debito', label: 'Débito', desc: mpReady ? 'Processado pelo gateway' : 'Configure o Mercado Pago', icon: <IconCard className="h-6 w-6" /> },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={method === opt.id}
                    onClick={() => setMethod(opt.id)}
                    className={cx(
                      'rounded-3xl border-2 p-4 text-left transition',
                      method === opt.id ? 'border-pink-600 bg-pink-50 shadow-portal' : 'border-pink-200 bg-white hover:border-pink-400',
                    )}
                  >
                    <span className={cx('block', method === opt.id ? 'text-pink-700' : 'text-ink-soft')}>{opt.icon}</span>
                    <span className="mt-2 block font-display font-bold text-grape">{opt.label}</span>
                    <span className="text-xs font-semibold text-pink-600">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {method === 'pix' && (
                <div className="card-premium p-6">
                  <h3 className="font-display text-lg font-bold text-grape">Pague com Pix e economize {brl(pixDiscount)}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {mpReady
                      ? 'O QR Code oficial é gerado pelo Mercado Pago com confirmação automática do pagamento.'
                      : 'Ambiente de demonstração: nenhuma cobrança será gerada. Configure a API do Mercado Pago para criar um Pix válido.'}
                  </p>

                  {mpReady ? (
                    <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                      <div className="rounded-3xl border-2 border-pink-100 bg-white p-3 shadow-card" aria-label="QR Code Pix do Mercado Pago">
                        {pixCharge?.pix?.qrCodeBase64 ? (
                          <img src={`data:image/png;base64,${pixCharge.pix.qrCodeBase64}`} alt="QR Code Pix gerado pelo Mercado Pago" className="h-48 w-48 object-contain" />
                        ) : (
                          <div className="grid h-48 w-48 place-items-center rounded-2xl bg-pink-50 p-4 text-center text-xs font-semibold text-ink-soft">
                            {pixLoading ? 'Gerando cobrança…' : 'Nenhuma cobrança gerada ainda'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-grape">Pix copia e cola · Mercado Pago</p>
                        <p className="mt-1.5 max-h-24 overflow-y-auto break-all rounded-2xl bg-pink-50 p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                          {pixCharge?.pix?.qrCode ?? 'Clique em “Gerar QR Code” para criar a cobrança oficial.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!pixCharge ? (
                            <button onClick={generatePix} disabled={pixLoading} className="btn-portal px-6 py-2.5 text-sm disabled:pointer-events-none">
                              {pixLoading ? 'Gerando…' : 'Gerar QR Code'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => navigator.clipboard?.writeText(pixCharge.pix?.qrCode ?? '').then(() => toast('Código Pix copiado!')).catch(() => toast('Não foi possível copiar', 'error'))}
                                className="btn-portal px-6 py-2.5 text-sm"
                              >
                                Copiar código Pix
                              </button>
                              <button onClick={generatePix} className="btn-ghost px-5 py-2.5 text-sm">Gerar novo</button>
                            </>
                          )}
                        </div>
                        {pixCharge && (
                          <p className={cx('mt-3 text-xs font-bold', pixPaid ? 'text-green-600' : 'text-amber-600')} role="status">
                            {pixPaid ? '✓ Pix confirmado — pagamento aprovado!' : '⏳ Aguardando o pagamento… verificamos automaticamente a cada 5 segundos.'}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                      <strong>Pix real indisponível neste ambiente.</strong>
                      <p className="mt-1">Não exibimos QR Code demonstrativo para evitar pagamentos enviados a uma chave que não corresponda a uma cobrança válida. O pedido de teste ficará pendente e não será considerado pago.</p>
                    </div>
                  )}
                </div>
              )}

              {(method === 'credito' || method === 'debito') && !mpReady && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                  <strong>Cartões indisponíveis no modo demonstração.</strong>
                  <p className="mt-1">Nenhum dado de cartão será solicitado ou armazenado. Configure a Public Key e o Worker do Mercado Pago para habilitar cobranças reais.</p>
                </div>
              )}

              {(method === 'credito' || method === 'debito') && mpReady && (
                <div className="card-premium p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-grape">
                      {method === 'credito' ? 'Cartão de crédito' : 'Cartão de débito'}
                    </h3>
                    {brand && (
                      <span className="rounded-full bg-grape px-3 py-1 text-xs font-bold text-pink-200 animate-pop">{brand}</span>
                    )}
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="card-number" className="mb-1.5 block text-sm font-bold text-grape">Número do cartão</label>
                      <input
                        id="card-number"
                        ref={cardRef}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={formatCard(card.number)}
                        onChange={(e) => setCard((c) => ({ ...c, number: onlyDigits(e.target.value).slice(0, 16) }))}
                        placeholder="0000 0000 0000 0000"
                        aria-invalid={Boolean(errors.number)}
                        className={cx('w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 font-mono text-[15px] outline-none focus:bg-white', errors.number ? 'border-red-400' : 'border-pink-200 focus:border-pink-500')}
                      />
                      {errors.number && <p className="mt-1 text-xs font-semibold text-red-500">{errors.number}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="card-name" className="mb-1.5 block text-sm font-bold text-grape">Nome impresso</label>
                      <input
                        id="card-name"
                        autoComplete="cc-name"
                        value={card.name}
                        onChange={(e) => setCard((c) => ({ ...c, name: e.target.value.toUpperCase() }))}
                        placeholder="MARIA D SILVA"
                        aria-invalid={Boolean(errors.cardName)}
                        className={cx('w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 uppercase outline-none focus:bg-white', errors.cardName ? 'border-red-400' : 'border-pink-200 focus:border-pink-500')}
                      />
                      {errors.cardName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.cardName}</p>}
                    </div>
                    <div>
                      <label htmlFor="card-expiry" className="mb-1.5 block text-sm font-bold text-grape">Validade</label>
                      <input
                        id="card-expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={formatExpiry(card.expiry)}
                        onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                        placeholder="MM/AA"
                        aria-invalid={Boolean(errors.expiry)}
                        className={cx('w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 font-mono outline-none focus:bg-white', errors.expiry ? 'border-red-400' : 'border-pink-200 focus:border-pink-500')}
                      />
                      {errors.expiry && <p className="mt-1 text-xs font-semibold text-red-500">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label htmlFor="card-cvv" className="mb-1.5 block text-sm font-bold text-grape">CVV</label>
                      <input
                        id="card-cvv"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={onlyDigits(card.cvv).slice(0, 4)}
                        onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                        placeholder="123"
                        aria-invalid={Boolean(errors.cvv)}
                        className={cx('w-full rounded-2xl border-2 bg-pink-50 px-4 py-3 font-mono outline-none focus:bg-white', errors.cvv ? 'border-red-400' : 'border-pink-200 focus:border-pink-500')}
                      />
                      {errors.cvv && <p className="mt-1 text-xs font-semibold text-red-500">{errors.cvv}</p>}
                    </div>
                    {method === 'credito' && (
                      <div className="sm:col-span-2">
                        <label htmlFor="installments" className="mb-1.5 block text-sm font-bold text-grape">Opções de parcelamento</label>
                        <select
                          id="installments"
                          value={card.installments}
                          onChange={(e) => setCard((c) => ({ ...c, installments: Number(e.target.value) }))}
                          className="w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3 outline-none focus:border-pink-500 focus:bg-white"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}x de aproximadamente {brl(total / n)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink-soft">
                    <IconShield className="h-4 w-4 text-pink-600" /> O número completo e o CVV são tokenizados pelo SDK do Mercado Pago; não os persistimos na loja.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-ghost px-7 py-3.5">Voltar</button>
                <button onClick={() => { if (validateStep2()) setStep(3) }} className="btn-portal px-8 py-3.5">
                  Revisar pedido
                </button>
              </div>
            </section>
          )}

          {/* ETAPA 3 */}
          {step === 3 && (
            <section aria-label="Revisão do pedido" className="space-y-5 animate-slide-up">
              <div className="card-premium p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-grape">Entregar em</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      <strong className="text-grape">{form.name}</strong><br />
                      {form.address}, {form.number} {form.complement && `— ${form.complement}`}<br />
                      {form.neighborhood} · {form.city}/{form.state} · CEP {form.zip}<br />
                      {form.phone} · {form.email}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-sm font-bold text-pink-700 hover:underline">Editar</button>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-grape">Pagamento</h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      {method === 'pix' && <>Pix · <strong className="text-pink-700">{settings.pixDiscount}% OFF</strong> aplicado{mpReady && pixCharge ? ` · cobrança MP #${pixCharge.id}` : ''}</>}
                      {method === 'credito' && <>{brand ?? 'Cartão'} de crédito •••• {onlyDigits(card.number).slice(-4)} · {card.installments}x de aproximadamente {brl(total / card.installments)}</>}
                      {method === 'debito' && <>{brand ?? 'Cartão'} de débito •••• {onlyDigits(card.number).slice(-4)} · aprovação imediata</>}
                    </p>
                  </div>
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-pink-700 hover:underline">Editar</button>
                </div>
              </div>

              <div className="card-premium p-6">
                <h2 className="font-display text-lg font-bold text-grape">Itens ({lines.length})</h2>
                <ul className="mt-4 space-y-3">
                  {lines.map(({ item, product }) => (
                    <li key={`${item.productId}-${item.variant}`} className="flex items-center gap-3">
                      <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="h-14 w-14 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-grape">{product.name}</p>
                        <p className="text-xs text-ink-soft">{item.variant} · {item.qty}x {brl(product.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-grape">{brl(product.price * item.qty)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button onClick={() => setStep(2)} className="btn-ghost px-7 py-3.5">Voltar</button>
                <button onClick={confirm} disabled={processing} className="btn-portal px-10 py-4 text-base disabled:pointer-events-none">
                  {processing ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      {mpReady ? 'Autorizando no Mercado Pago…' : 'Autorizando pagamento…'}
                    </>
                  ) : (
                    <>{mpReady ? 'Pagar' : 'Confirmar pedido'} · {brl(total)}</>
                  )}
                </button>
              </div>

              {payError && (
                <p role="alert" className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                  {payError}
                </p>
              )}

              {processing && (
                <p className="text-center text-sm text-ink-soft" role="status">
                  {mpReady
                    ? 'Tokenizando o cartão no navegador e criando o pagamento via Mercado Pago…'
                    : 'Conectando à adquirente com criptografia ponta a ponta…'}
                </p>
              )}

              {mpReady && (
                <p className="text-center text-xs text-ink-soft">
                  🔒 Processado pelo Mercado Pago · os dados do cartão são tokenizados no seu navegador e nunca passam pela KOMBINE.
                </p>
              )}
            </section>
          )}
        </div>

        {/* RESUMO */}
        <aside className="self-start rounded-3xl border border-pink-100 bg-white p-6 shadow-card lg:sticky lg:top-24" aria-label="Resumo do pedido">
          <h2 className="font-display text-lg font-bold text-grape">Resumo</h2>
          <ul className="mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {lines.map(({ item, product }) => (
              <li key={`${item.productId}-${item.variant}`} className="flex items-center gap-2.5 text-sm">
                <ProductArt art={product.art} imageUrl={product.imageUrl} mediaType={product.mediaType} className="h-10 w-10 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1 truncate text-ink-soft">{product.name} · {item.qty}x</span>
                <span className="font-semibold text-grape">{brl(product.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-pink-100 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-bold text-grape">{brl(subtotal)}</dd></div>
            {couponDiscount > 0 && <div className="flex justify-between text-pink-700"><dt>Cupom {coupon}</dt><dd className="font-bold">-{brl(couponDiscount)}</dd></div>}
            {pixDiscount > 0 && <div className="flex justify-between text-pink-700"><dt>Desconto Pix ({settings.pixDiscount}%)</dt><dd className="font-bold">-{brl(pixDiscount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Frete</dt><dd className="font-bold text-grape">{shipping === 0 ? <span className="text-pink-700">Grátis</span> : brl(shipping)}</dd></div>
            <div className="flex justify-between border-t border-pink-100 pt-3 text-base">
              <dt className="font-bold text-grape">Total</dt>
              <dd className="font-display text-xl font-extrabold text-grape">{brl(total)}</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
            <IconClose className="hidden" /> 🔒 {settings.paymentPolicy}
          </p>
        </aside>
      </div>
    </div>
  )
}
