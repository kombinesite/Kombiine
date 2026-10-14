/**
 * KOMBINE — Backend de pagamentos (Cloudflare Worker).
 *
 * SEGREDOS (configurar com `wrangler secret put`, nunca no repositório):
 *   MP_ACCESS_TOKEN      → Access Token da aplicação Mercado Pago
 *   MP_WEBHOOK_SECRET    → segredo de assinatura das notificações
 *
 * Variável não sensível (wrangler.toml):
 *   ALLOWED_ORIGIN       → origem da loja autorizada a chamar a API
 *
 * Rotas:
 *   GET  /api/health
 *   POST /api/payments/card      → cria pagamento com cartão (token do frontend)
 *   POST /api/payments/pix       → cria pagamento Pix e devolve QR Code
 *   GET  /api/payments/:id       → consulta status do pagamento
 *   POST /api/webhooks/mercadopago → valida assinatura e confirma o recebimento
 */

const MP_API = 'https://api.mercadopago.com'

const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  })

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
  const origin = request.headers.get('Origin') || ''
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const ok = allowed.includes(origin) || (isLocal && env.ALLOW_LOCAL === 'true')
  return {
    'Access-Control-Allow-Origin': ok ? origin : (allowed[0] || 'null'),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id',
    'Access-Control-Max-Age': '86400', Vary: 'Origin',
    ...(ok ? {} : { 'X-Kombine-Origin': 'bloqueada' }),
  }
}
const isOriginAllowed = (env, request) => corsHeaders(env, request)['X-Kombine-Origin'] !== 'bloqueada'
const COOKIE_NAME = 'kombine_admin'
const SESSION_SECONDS = 8 * 60 * 60
const nowIso = () => new Date().toISOString()
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((x) => parseInt(x, 16)))
const constantTimeEqual = (a, b) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
async function derivePassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: 210000, hash: 'SHA-256' }, key, 256))
}
async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)))
}
async function ensureAdmin(env) {
  const row = await env.DB.prepare('SELECT id FROM admin_users WHERE id=1').first()
  if (!row) {
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
    const hash = await derivePassword('123456', salt)
    await env.DB.prepare('INSERT INTO admin_users (id,password_salt,password_hash,must_change_password,updated_at) VALUES (1,?,?,1,?)').bind(salt, hash, nowIso()).run()
  }
}
function cookieValue(request) {
  const cookie = request.headers.get('Cookie') || ''
  const part = cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE_NAME}=`))
  return part ? decodeURIComponent(part.slice(COOKIE_NAME.length + 1)) : ''
}
async function createSession(env) {
  if (!env.ADMIN_SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET não configurado')
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now()/1000) + SESSION_SECONDS, nonce: crypto.randomUUID() })).replace(/=/g,'')
  const token = `${payload}.${await hmac(env.ADMIN_SESSION_SECRET, payload)}`
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash,expires_at,created_at) VALUES (?,?,?)').bind(tokenHash, Math.floor(Date.now()/1000) + SESSION_SECONDS, nowIso()).run()
  return token
}
async function adminSession(request, env) {
  const token = cookieValue(request)
  if (!token || !env.ADMIN_SESSION_SECRET) return null
  const [payload, sig, extra] = token.split('.')
  if (!payload || !sig || extra || !constantTimeEqual(await hmac(env.ADMIN_SESSION_SECRET, payload), sig)) return null
  let data
  try { data = JSON.parse(atob(payload)) } catch { return null }
  if (!data.exp || data.exp < Date.now()/1000) return null
  const tokenHash = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
  const row = await env.DB.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(tokenHash, Math.floor(Date.now()/1000)).first()
  if (!row) return null
  return { tokenHash, expiresAt: data.exp }
}
const sessionCookie = (token, maxAge=SESSION_SECONDS) => `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
async function requireAdmin(request, env) { return await adminSession(request, env) }
async function adminApi(request, env, url, cors) {
  if (!env.DB) return json({ error: 'Banco D1 não configurado.' }, 503, cors)
  if (url.pathname === '/api/admin/auth/login' && request.method === 'POST') {
    if (!env.ADMIN_SESSION_SECRET) return json({ error: 'Configuração incompleta: defina ADMIN_SESSION_SECRET no Worker.' }, 503, cors)
    await ensureAdmin(env)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE attempted_at<?').bind(Date.now()-24*60*60*1000).run()
    const ipHash = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}:${env.ADMIN_SESSION_SECRET || 'missing'}`)))
    const attempts = await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_login_attempts WHERE ip_hash=? AND successful=0 AND attempted_at>?').bind(ipHash, Date.now()-15*60*1000).first()
    if ((attempts?.n || 0) >= 8) return json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, 429, cors)
    const body = await request.json().catch(() => ({}))
    const user = await env.DB.prepare('SELECT * FROM admin_users WHERE id=1').first()
    const supplied = typeof body.password === 'string' ? body.password : ''
    const hash = await derivePassword(supplied, user.password_salt)
    const valid = constantTimeEqual(hash, user.password_hash)
    await env.DB.prepare('INSERT INTO admin_login_attempts (ip_hash,attempted_at,successful) VALUES (?,?,?)').bind(ipHash, Date.now(), valid ? 1 : 0).run()
    if (!valid) return json({ error: 'Credenciais inválidas.' }, 401, cors)
    const token = await createSession(env)
    return json({ ok: true, mustChangePassword: Boolean(user.must_change_password) }, 200, { ...cors, 'Set-Cookie': sessionCookie(token) })
  }
  if (url.pathname === '/api/admin/auth/logout' && request.method === 'POST') {
    const session = await adminSession(request, env)
    if (session) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(session.tokenHash).run()
    return json({ ok: true }, 200, { ...cors, 'Set-Cookie': sessionCookie('', 0) })
  }
  if (url.pathname === '/api/admin/auth/password' && request.method === 'POST') {
    const session = await requireAdmin(request, env)
    if (!session) return json({ error: 'Sessão administrativa inválida.' }, 401, cors)
    const body = await request.json().catch(() => ({}))
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128 || !/[a-z]/.test(body.password) || !/[A-Z]/.test(body.password) || !/[0-9]/.test(body.password)) return json({ error: 'Use uma senha de 12+ caracteres com maiúscula, minúscula e número.' }, 400, cors)
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
    const hash = await derivePassword(body.password, salt)
    await env.DB.prepare('UPDATE admin_users SET password_salt=?,password_hash=?,must_change_password=0,updated_at=? WHERE id=1').bind(salt, hash, nowIso()).run()
    await env.DB.prepare('DELETE FROM admin_sessions').run()
    const token = await createSession(env)
    return json({ ok: true, mustChangePassword: false }, 200, { ...cors, 'Set-Cookie': sessionCookie(token) })
  }
  if (url.pathname === '/api/admin/auth/session' && request.method === 'GET') {
    const session = await requireAdmin(request, env)
    if (!session) return json({ authenticated: false }, 401, cors)
    const user = await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE id=1').first()
    return json({ authenticated: true, mustChangePassword: Boolean(user?.must_change_password) }, 200, cors)
  }
  if (url.pathname.startsWith('/api/admin/')) {
    const session = await requireAdmin(request, env)
    if (!session) return json({ error: 'Autenticação administrativa necessária.' }, 401, cors)
    const user = await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE id=1').first()
    if (user?.must_change_password && !url.pathname.endsWith('/auth/password')) return json({ error: 'Troque a senha inicial antes de continuar.' }, 428, cors)

  }
  return null
}

async function loadStoreState(env) {
  const row = await env.DB.prepare('SELECT state_json FROM store_state WHERE id=1').first()
  if (!row) return null
  try { return JSON.parse(row.state_json) } catch { return null }
}
async function saveOrder(env, order, paymentId=null) {
  await env.DB.prepare('INSERT INTO orders (id,state_json,status,payment_id,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json,status=excluded.status,payment_id=COALESCE(excluded.payment_id,orders.payment_id),updated_at=excluded.updated_at')
    .bind(order.id, JSON.stringify(order), order.status, paymentId, order.createdAt || nowIso(), nowIso()).run()
}
async function getStoredOrder(env, orderId) {
  const row = await env.DB.prepare('SELECT state_json,status,payment_id FROM orders WHERE id=?').bind(orderId).first()
  if (!row) return null
  try { const order = JSON.parse(row.state_json); order.status = row.status; if (row.payment_id) order.payment.paymentId = row.payment_id; return order } catch { return null }
}
async function updateStoredOrderStatus(env, orderId, status, paymentId) {
  const order = await getStoredOrder(env, orderId)
  if (!order) return false
  const previousStatus = order.status
  if (previousStatus !== status) {
    const state = await loadStoreState(env)
    if (state && Array.isArray(state.products)) {
      if (previousStatus !== 'pago' && status === 'pago') {
        state.products = state.products.map((p) => { const item = order.items.find((i) => i.productId === p.id); return item ? { ...p, stock: Math.max(0, Number(p.stock) - item.qty), sales: Number(p.sales || 0) + item.qty } : p })
      } else if (previousStatus === 'pago' && status === 'cancelado') {
        state.products = state.products.map((p) => { const item = order.items.find((i) => i.productId === p.id); return item ? { ...p, stock: Number(p.stock) + item.qty, sales: Math.max(0, Number(p.sales || 0) - item.qty) } : p })
      }
      await env.DB.prepare('UPDATE store_state SET state_json=?,updated_at=? WHERE id=1').bind(JSON.stringify(state), nowIso()).run()
    }
  }
  order.status = status
  order.payment = { ...(order.payment || {}), ...(paymentId ? { paymentId, gateway: 'mercadopago' } : {}) }
  await saveOrder(env, order, paymentId || null)
  return true
}
async function orderStillFulfillable(env, order) {
  if (!order || Date.now() - new Date(order.createdAt).getTime() > 30 * 60 * 1000) return false
  const state = await loadStoreState(env)
  if (!state || !Array.isArray(state.products)) return false
  const rows = await env.DB.prepare("SELECT id,state_json FROM orders WHERE status='pendente' AND created_at>=?").bind(new Date(Date.now() - 30 * 60 * 1000).toISOString()).all()
  const reserved = new Map()
  for (const row of (rows.results || [])) {
    if (row.id === order.id) continue
    try { const pending = JSON.parse(row.state_json); for (const item of (pending.items || [])) reserved.set(item.productId, (reserved.get(item.productId) || 0) + Number(item.qty || 0)) } catch {}
  }
  return order.items.every((item) => {
    const product = state.products.find((p) => p.id === item.productId)
    return Boolean(product) && Number(product.stock) - (reserved.get(item.productId) || 0) >= Number(item.qty)
  })
}

async function createOrder(request, env, cors) {
  if (!env.DB) return json({ error: 'Banco D1 não configurado.' }, 503, cors)
  const state = await loadStoreState(env)
  if (!state || !Array.isArray(state.products)) return json({ error: 'Catálogo ainda não foi inicializado no painel administrativo.' }, 503, cors)
  const body = await request.json().catch(() => null)
  if (!body || !body.customer || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return json({ error: 'Dados do pedido inválidos.' }, 400, cors)
  const customer = body.customer
  const digits = (value) => String(value || '').replace(/\D/g, '')
  if (typeof customer.name !== 'string' || customer.name.trim().length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(customer.email || '')) || digits(customer.zip).length !== 8 || digits(customer.phone).length < 10 || digits(customer.cpf).length !== 11 || !String(customer.address || '').trim() || !String(customer.number || '').trim() || !String(customer.neighborhood || '').trim() || !String(customer.city || '').trim() || !/^[A-Z]{2}$/.test(String(customer.state || '').toUpperCase())) return json({ error: 'Dados de entrega inválidos.' }, 400, cors)
  const expiryCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  await env.DB.prepare("UPDATE orders SET status='cancelado',updated_at=? WHERE status='pendente' AND created_at<?").bind(nowIso(), expiryCutoff).run()
  const method = ['pix','credito','debito'].includes(body.method) ? body.method : null
  if (!method) return json({ error: 'Forma de pagamento inválida.' }, 400, cors)
  let subtotal = 0
  const items = []
  const pendingRows = await env.DB.prepare("SELECT state_json FROM orders WHERE status='pendente' AND created_at>=?").bind(expiryCutoff).all()
  const reserved = new Map()
  for (const row of (pendingRows.results || [])) { try { const pending = JSON.parse(row.state_json); for (const item of (pending.items || [])) reserved.set(item.productId, (reserved.get(item.productId) || 0) + Number(item.qty || 0)) } catch {} }
  for (const requested of body.items) {
    const qty = Number(requested.qty)
    const product = state.products.find((p) => p.id === requested.productId)
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20 || Number(product.stock) - (reserved.get(requested.productId) || 0) < qty) return json({ error: `Produto indisponível ou estoque insuficiente: ${product?.name || 'item'}.` }, 409, cors)
    subtotal += Number(product.price) * qty
    items.push({ productId: product.id, qty, variant: String(requested.variant || '').slice(0,80), name: product.name, price: Number(product.price), art: product.art, imageUrl: product.imageUrl, mediaType: product.mediaType })
  }
  const couponCode = String(body.coupon || '').toUpperCase()
  const couponPct = ({ KOMBINE10: 10, BEMVINDA: 15, ROSA20: 20 })[couponCode] || 0
  const couponDiscount = subtotal * couponPct / 100
  const pixDiscount = method === 'pix' ? subtotal * Math.min(50, Math.max(0, Number(state.settings?.pixDiscount) || 0)) / 100 : 0
  const shipping = subtotal >= Math.max(0, Number(state.settings?.freeShippingMin) || 0) ? 0 : Math.max(0, Number(state.settings?.shippingFee) || 0)
  const total = Math.max(0, Number((subtotal - couponDiscount - pixDiscount + shipping).toFixed(2)))
  if (total <= 0) return json({ error: 'Total do pedido inválido.' }, 400, cors)
  const id = `KMB-${crypto.randomUUID()}`
  const order = { id, createdAt: nowIso(), customer, items, payment: { method }, subtotal: Number(subtotal.toFixed(2)), discount: Number((couponDiscount + pixDiscount).toFixed(2)), shipping: Number(shipping.toFixed(2)), total, status: 'pendente' }
  await saveOrder(env, order)
  return json({ id, total, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, status: order.status }, 201, cors)
}

/** Chave de idempotência estável por pedido + tentativa. */
async function idempotencyKey(orderId, attempt) {
  const data = new TextEncoder().encode(`${orderId}:${attempt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

const normalizePayer = (payer = {}) => {
  const parts = String(payer.name ?? '').trim().split(/\s+/)
  const firstName = payer.firstName ?? parts[0] ?? undefined
  const lastName = payer.lastName ?? (parts.length > 1 ? parts.slice(1).join(' ') : undefined)
  return {
    email: payer.email,
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {}),
    ...(payer.identification?.number
      ? { identification: { type: payer.identification.type ?? 'CPF', number: String(payer.identification.number).replace(/\D/g, '') } }
      : {}),
  }
}

function validateIntent(body) {
  const errors = []
  if (typeof body?.orderId !== 'string' || !/^[A-Za-z0-9_-]{4,80}$/.test(body.orderId)) errors.push('orderId')
  if (!(Number(body?.amount) > 0) || Number(body?.amount) > 100000) errors.push('amount')
  if (!body?.payer?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.payer.email)) errors.push('payer.email')
  return errors
}

async function mpFetch(env, path, init = {}) {
  if (!env.MP_ACCESS_TOKEN) {
    return { res: { ok: false, status: 503 }, data: { message: 'Mercado Pago não configurado: defina o secret MP_ACCESS_TOKEN no Worker.' } }
  }
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

const toPublicPayment = (data) => ({
  id: data.id,
  status: data.status,
  statusDetail: data.status_detail,
  method: data.payment_method_id,
  last4: data.card?.last_four_digits,
  brand: data.payment_method_id,
  ...(data.point_of_interaction?.transaction_data
    ? {
        pix: {
          qrCode: data.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
          ticketUrl: data.point_of_interaction.transaction_data.ticket_url,
        },
      }
    : {}),
  ...(data.date_of_expiration ? { expiration: data.date_of_expiration } : {}),
})

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const cors = corsHeaders(env, request)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (url.pathname.startsWith('/api/') && url.pathname !== '/api/webhooks/mercadopago' && request.headers.get('Origin') && !isOriginAllowed(env, request)) {
      return json({ error: 'Origem não autorizada.' }, 403, cors)
    }

    try {
      if (url.pathname.startsWith('/api/admin/')) {
        const response = await adminApi(request, env, url, cors)
        if (response) return response
      }
      if (url.pathname === '/api/orders' && request.method === 'POST') return await createOrder(request, env, cors)
      const orderStatusMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/status$/)
      if (orderStatusMatch && request.method === 'POST') {
        const session = await requireAdmin(request, env)
        if (!session) return json({ error: 'Autenticação administrativa necessária.' }, 401, cors)
        const admin = await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE id=1').first()
        if (admin?.must_change_password) return json({ error: 'Troque a senha inicial antes de continuar.' }, 428, cors)
        const body = await request.json().catch(() => ({}))
        const allowedStatuses = ['pendente','pago','enviado','entregue','cancelado']
        if (!allowedStatuses.includes(body.status)) return json({ error: 'Status de pedido inválido.' }, 400, cors)
        const orderId = decodeURIComponent(orderStatusMatch[1])
        const order = await getStoredOrder(env, orderId)
        if (!order) return json({ error: 'Pedido não encontrado.' }, 404, cors)
        const transitions = { pendente: ['pago','cancelado'], pago: ['enviado','cancelado'], enviado: ['entregue'], entregue: [], cancelado: [] }
        if (body.status !== order.status && !transitions[order.status]?.includes(body.status)) return json({ error: `Transição inválida: ${order.status} → ${body.status}.` }, 409, cors)
        await updateStoredOrderStatus(env, orderId, body.status, body.paymentId ? String(body.paymentId) : null)
        return json({ ok: true, status: body.status }, 200, cors)
      }
      if (url.pathname === '/api/admin/store/state' && request.method === 'GET') {
        const session = await requireAdmin(request, env)
        if (!session) return json({ error: 'Autenticação administrativa necessária.' }, 401, cors)
        const admin = await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE id=1').first()
        if (admin?.must_change_password) return json({ error: 'Troque a senha inicial antes de continuar.' }, 428, cors)
        const state = await loadStoreState(env)
        if (!state) return json({ initialized: false }, 200, cors)
        const rows = await env.DB.prepare('SELECT state_json,status,payment_id FROM orders ORDER BY created_at DESC LIMIT 1000').all()
        const orders = (rows.results || []).map((r) => { try { const o = JSON.parse(r.state_json); o.status = r.status; if (r.payment_id) o.payment.paymentId = r.payment_id; return o } catch { return null } }).filter(Boolean)
        return json({ ...state, orders, initialized: true }, 200, cors)
      }
      if (url.pathname === '/api/store/state' && request.method === 'GET') {
        if (!env.DB) return json({ error: 'Banco D1 não configurado.' }, 503, cors)
        const row = await env.DB.prepare('SELECT state_json,updated_at FROM store_state WHERE id=1').first()
        if (!row) return json({ initialized: false }, 200, cors)
        const state = JSON.parse(row.state_json)
        // Pedidos e dados pessoais nunca são expostos pela rota pública.
        return json({ products: state.products, settings: state.settings, seedVersion: state.seedVersion, initialized: true, updatedAt: row.updated_at }, 200, cors)
      }
      if (url.pathname === '/api/store/state' && request.method === 'PUT') {
        const session = await requireAdmin(request, env)
        if (!session) return json({ error: 'Autenticação administrativa necessária.' }, 401, cors)
        const admin = await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE id=1').first()
        if (admin?.must_change_password) return json({ error: 'Troque a senha inicial antes de continuar.' }, 428, cors)
        const body = await request.json().catch(() => null)
        if (!body || !Array.isArray(body.products) || !Array.isArray(body.orders) || !body.settings || body.products.length > 5000 || body.orders.length > 10000) return json({ error: 'Estado da loja inválido.' }, 400, cors)
        const serialized = JSON.stringify({ products: body.products, orders: body.orders, settings: body.settings, seedVersion: body.seedVersion ?? 4 })
        if (serialized.length > 2_000_000) return json({ error: 'Dados da loja excedem o limite permitido.' }, 413, cors)
        await env.DB.prepare('INSERT INTO store_state (id,state_json,updated_at) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at').bind(serialized, nowIso()).run()
        return json({ ok: true, updatedAt: nowIso() }, 200, cors)
      }
      // ---- Health ----
      if (url.pathname === '/api/health') {
        return json(
          { ok: true, service: 'kombine', mercadoPago: Boolean(env.MP_ACCESS_TOKEN), time: new Date().toISOString() },
          200,
          cors,
        )
      }

      // ---- Cartão de crédito/débito ----
      if (url.pathname === '/api/payments/card' && request.method === 'POST') {
        const body = await request.json().catch(() => null)
        const errors = validateIntent(body)
        if (errors.length) return json({ error: `Dados inválidos: ${errors.join(', ')}` }, 400, cors)
        const storedOrder = await getStoredOrder(env, body.orderId)
        if (!storedOrder || storedOrder.status !== 'pendente' || Math.abs(Number(body.amount) - Number(storedOrder.total)) > 0.009 || body.method !== storedOrder.payment.method || !['credito','debito'].includes(storedOrder.payment.method) || String(body.payer?.email || '').toLowerCase() !== String(storedOrder.customer?.email || '').toLowerCase()) return json({ error: 'Pedido não encontrado, já processado ou valor divergente.' }, 409, cors)
        if (!(await orderStillFulfillable(env, storedOrder))) { await updateStoredOrderStatus(env, body.orderId, 'cancelado'); return json({ error: 'O pedido expirou ou o estoque mudou. Refaça o pedido para continuar.' }, 409, cors) }
        if (!body.token || !body.paymentMethodId) {
          return json({ error: 'Token do cartão ausente. Tokenize o cartão com a Public Key antes de enviar.' }, 400, cors)
        }

        const { res, data } = await mpFetch(env, '/v1/payments', {
          method: 'POST',
          headers: { 'X-Idempotency-Key': await idempotencyKey(body.orderId, body.attempt ?? 1) },
          body: JSON.stringify({
            transaction_amount: Number(Number(body.amount).toFixed(2)),
            token: body.token,
            description: body.description ?? `Pedido ${body.orderId}`,
            installments: body.method === 'debito' ? 1 : Math.min(12, Math.max(1, Number(body.installments ?? 1))),
            payment_method_id: body.paymentMethodId,
            statement_descriptor: 'KOMBINE',
            external_reference: body.orderId,
            notification_url: body.notificationUrl,
            payer: normalizePayer(body.payer),
          }),
        })

        if (!res.ok) {
          return json(
            { error: data.message ?? 'Pagamento não autorizado.', detail: data.cause?.map((c) => c.description).join(' ') ?? data.error },
            res.status === 400 ? 402 : res.status,
            cors,
          )
        }
        if (data.status === 'approved') await updateStoredOrderStatus(env, body.orderId, 'pago', String(data.id))
        else if (data.status === 'cancelled' || data.status === 'rejected') await updateStoredOrderStatus(env, body.orderId, 'cancelado', String(data.id))
        return json(toPublicPayment(data), 200, cors)
      }

      // ---- Pix ----
      if (url.pathname === '/api/payments/pix' && request.method === 'POST') {
        const body = await request.json().catch(() => null)
        const errors = validateIntent(body)
        if (errors.length) return json({ error: `Dados inválidos: ${errors.join(', ')}` }, 400, cors)
        const storedOrder = await getStoredOrder(env, body.orderId)
        if (!storedOrder || storedOrder.status !== 'pendente' || Math.abs(Number(body.amount) - Number(storedOrder.total)) > 0.009 || storedOrder.payment.method !== 'pix' || String(body.payer?.email || '').toLowerCase() !== String(storedOrder.customer?.email || '').toLowerCase()) return json({ error: 'Pedido não encontrado, já processado ou valor divergente.' }, 409, cors)
        if (!(await orderStillFulfillable(env, storedOrder))) { await updateStoredOrderStatus(env, body.orderId, 'cancelado'); return json({ error: 'O pedido expirou ou o estoque mudou. Refaça o pedido para continuar.' }, 409, cors) }

        const expires = new Date(Date.now() + 30 * 60 * 1000)
        const { res, data } = await mpFetch(env, '/v1/payments', {
          method: 'POST',
          headers: { 'X-Idempotency-Key': await idempotencyKey(body.orderId, body.attempt ?? 1) },
          body: JSON.stringify({
            transaction_amount: Number(Number(body.amount).toFixed(2)),
            description: body.description ?? `Pedido ${body.orderId}`,
            payment_method_id: 'pix',
            date_of_expiration: `${new Date(expires.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19)}.000-03:00`,
            external_reference: body.orderId,
            notification_url: body.notificationUrl,
            payer: normalizePayer(body.payer),
          }),
        })

        if (!res.ok) {
          return json({ error: data.message ?? 'Não foi possível gerar o Pix.', detail: data.error }, res.status, cors)
        }
        if (data.status === 'approved') await updateStoredOrderStatus(env, body.orderId, 'pago', String(data.id))
        else if (data.status === 'cancelled' || data.status === 'rejected') await updateStoredOrderStatus(env, body.orderId, 'cancelado', String(data.id))
        return json(toPublicPayment(data), 200, cors)
      }

      // ---- Consulta de status ----
      if (url.pathname.startsWith('/api/payments/') && request.method === 'GET') {
        const id = url.pathname.split('/').pop()
        if (!/^\d+$/.test(id ?? '')) return json({ error: 'ID de pagamento inválido.' }, 400, cors)
        const { res, data } = await mpFetch(env, `/v1/payments/${id}`)
        if (!res.ok) return json({ error: data.message ?? 'Pagamento não encontrado.' }, res.status, cors)
        if (data.external_reference && data.status === 'approved') await updateStoredOrderStatus(env, String(data.external_reference), 'pago', String(data.id))
        else if (data.external_reference && ['cancelled','rejected','refunded','charged_back'].includes(data.status)) await updateStoredOrderStatus(env, String(data.external_reference), 'cancelado', String(data.id))
        return json({ id: data.id, status: data.status, statusDetail: data.status_detail, method: data.payment_method_id }, 200, cors)
      }

      // ---- Webhook ----
      if (url.pathname === '/api/webhooks/mercadopago' && request.method === 'POST') {
        const raw = await request.text()
        const parsed = (() => { try { return JSON.parse(raw) } catch { return {} } })()
        const dataId = parsed?.data?.id ?? url.searchParams.get('data.id')
        const type = parsed?.type ?? url.searchParams.get('type') ?? 'payment'

        // Validação da assinatura (manifest documentado pelo Mercado Pago)
        if (!env.MP_WEBHOOK_SECRET) return json({ error: 'Webhook não configurado com segredo.' }, 503, cors)
        {
          const signature = request.headers.get('x-signature') ?? ''
          const requestId = request.headers.get('x-request-id') ?? ''
          const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=').map((s) => s.trim())))
          const valid = await verifyWebhookSignature(env.MP_WEBHOOK_SECRET, dataId, requestId, parts)
          if (!valid) return json({ error: 'Assinatura inválida.' }, 401, cors)
        }

        // Tratamos o evento como aviso: buscamos o estado real na API.
        let status = 'desconhecido'
        if (type === 'payment' && dataId) {
          const { res, data } = await mpFetch(env, `/v1/payments/${dataId}`)
          if (res.ok) status = data.status
        }
        if (type === 'payment' && dataId && env.DB) {
          const { res, data } = await mpFetch(env, `/v1/payments/${dataId}`)
          if (res.ok && data.external_reference) {
            const eventId = `${data.id}:${data.status}:${data.date_last_updated || data.date_approved || ''}`
            const exists = await env.DB.prepare('SELECT event_id FROM webhook_events WHERE event_id=?').bind(eventId).first()
            if (!exists) {
              const mapped = data.status === 'approved' ? 'pago' : ['cancelled','rejected','refunded','charged_back'].includes(data.status) ? 'cancelado' : 'pendente'
              await updateStoredOrderStatus(env, String(data.external_reference), mapped, String(data.id))
              await env.DB.prepare('INSERT INTO webhook_events (event_id,payment_id,status,received_at) VALUES (?,?,?,?)').bind(eventId, String(data.id), String(data.status), nowIso()).run()
            }
            status = data.status
          }
        }
        return json({ received: true, type, dataId, status }, 200, cors)
      }

      return json({ error: 'Rota não encontrada.' }, 404, cors)
    } catch (err) {
      return json({ error: 'Erro interno ao processar a solicitação. Consulte os logs privados do Worker.' }, 500, cors)
    }
  },
}

/** HMAC-SHA256 sobre o manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` */
async function verifyWebhookSignature(secret, dataId, requestId, { ts, v1 }) {
  if (!ts || !v1) return false
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex.length !== v1.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i)
  return diff === 0
}
