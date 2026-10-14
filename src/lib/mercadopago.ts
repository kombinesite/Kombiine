/**
 * Integração Mercado Pago — camada de frontend.
 *
 * Fluxo correto e seguro (documentação oficial):
 *  1. O navegador tokeniza o cartão com o SDK MercadoPago.js usando a PUBLIC KEY.
 *  2. O token (de uso único) é enviado ao nosso backend (Cloudflare Worker).
 *  3. O Worker usa o ACCESS TOKEN (secreto) para criar o pagamento em /v1/payments.
 *  4. Pix é criado pelo Worker e devolve qr_code / qr_code_base64 / ticket_url.
 *
 * Basta preencher as chaves em `.env` (ver `.env.example`) — nada mais a alterar.
 */

const SDK_URL = 'https://sdk.mercadopago.com/js/v2'

export const MP_PUBLIC_KEY = (import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined) ?? ''
export const MP_API_URL = (import.meta.env.VITE_MP_API_URL as string | undefined) ?? ''

export const isMercadoPagoConfigured = () => Boolean(MP_PUBLIC_KEY && MP_API_URL)

interface MPInstance {
  createCardToken: (data: Record<string, unknown>) => Promise<{
    id?: string
    error?: string
    cause?: Array<{ code?: string; description?: string }>
  }>
}

let mpInstance: MPInstance | null = null
let sdkPromise: Promise<MPInstance | null> | null = null

/** Carrega o SDK oficial (v2) uma única vez. */
export function loadMercadoPagoSdk(): Promise<MPInstance | null> {
  if (!MP_PUBLIC_KEY) return Promise.resolve(null)
  if (mpInstance) return Promise.resolve(mpInstance)
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve) => {
    const win = window as unknown as { MercadoPago?: new (key: string, opts?: Record<string, unknown>) => MPInstance }
    const init = () => {
      if (!win.MercadoPago) return resolve(null)
      mpInstance = new win.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })
      resolve(mpInstance)
    }
    if (win.MercadoPago) return init()

    let script = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', init)
    script.addEventListener('error', () => resolve(null))
  })

  return sdkPromise
}

export interface CardTokenInput {
  number: string
  name: string
  expiry: string // MM/AA
  cvv: string
  docType?: string
  docNumber?: string
}

/** Tokeniza os dados do cartão no navegador (a PAN nunca vai ao nosso servidor). */
export async function createCardToken(input: CardTokenInput): Promise<string> {
  const mp = await loadMercadoPagoSdk()
  if (!mp) throw new Error('SDK do Mercado Pago indisponível. Verifique sua conexão e a Public Key.')

  const [month, year] = input.expiry.split('/')
  const result = await mp.createCardToken({
    cardNumber: input.number.replace(/\D/g, ''),
    cardholderName: input.name,
    cardExpirationMonth: month,
    cardExpirationYear: year?.length === 2 ? `20${year}` : year,
    securityCode: input.cvv.replace(/\D/g, ''),
    identificationType: input.docType ?? 'CPF',
    identificationNumber: input.docNumber?.replace(/\D/g, ''),
  })

  if (!result?.id) {
    const detail = result?.cause?.[0]?.description ?? result?.error ?? 'Não foi possível validar o cartão.'
    throw new Error(detail)
  }
  return result.id
}

export interface PaymentIntent {
  orderId: string
  amount: number
  method: 'credito' | 'debito' | 'pix'
  description: string
  payer: {
    email: string
    name?: string
    firstName?: string
    lastName?: string
    identification?: { type: string; number: string }
  }
  token?: string
  paymentMethodId?: string
  installments?: number
}

export interface PaymentResult {
  id: string | number
  status: string
  statusDetail?: string
  method: string
  pix?: { qrCode: string; qrCodeBase64: string; ticketUrl: string; expiration?: string }
  last4?: string
  brand?: string
}

async function callBackend<T>(path: string, init?: RequestInit): Promise<T> {
  if (!MP_API_URL) throw new Error('URL do backend de pagamentos não configurada (VITE_MP_API_URL).')
  const res = await fetch(`${MP_API_URL.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string }
  if (!res.ok) throw new Error(data.error ?? data.message ?? `Falha ao processar pagamento (HTTP ${res.status}).`)
  return data
}

/** Cria o pagamento com cartão (crédito/débito) via backend + Access Token. */
export const payWithCard = (intent: PaymentIntent) =>
  callBackend<PaymentResult>('/api/payments/card', { method: 'POST', body: JSON.stringify(intent) })

/** Cria o pagamento Pix e devolve QR Code (base64) + copia-e-cola. */
export const payWithPix = (intent: PaymentIntent) =>
  callBackend<PaymentResult>('/api/payments/pix', { method: 'POST', body: JSON.stringify(intent) })

/** Consulta o status atual do pagamento (usado no polling do Pix). */
export const getPaymentStatus = (id: string | number) =>
  callBackend<PaymentResult>(`/api/payments/${id}`, { method: 'GET' })

export const MP_STATUS_LABEL: Record<string, string> = {
  approved: 'Pagamento aprovado',
  pending: 'Aguardando pagamento',
  in_process: 'Em análise',
  authorized: 'Autorizado',
  rejected: 'Pagamento recusado',
  cancelled: 'Pagamento cancelado',
  refunded: 'Pagamento devolvido',
  charged_back: 'Contestado',
}
