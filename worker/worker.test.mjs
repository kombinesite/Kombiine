import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = { ALLOWED_ORIGIN: 'https://kombine.shop', ALLOW_LOCAL: 'false' }

test('health responde sem expor segredo e sem exigir Origin', async () => {
  const response = await worker.fetch(new Request('https://api.kombine.shop/api/health'), env)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.mercadoPago, false)
})

test('origem externa não autorizada é bloqueada', async () => {
  const request = new Request('https://api.kombine.shop/api/payments/pix', {
    method: 'POST', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'KMB-123456', amount: 10, payer: { email: 'test@example.com' } }),
  })
  const response = await worker.fetch(request, env)
  assert.equal(response.status, 403)
})

test('pedido não é criado sem D1 configurado', async () => {
  const request = new Request('https://api.kombine.shop/api/orders', {
    method: 'POST', headers: { Origin: 'https://kombine.shop', 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: {}, items: [], method: 'pix' }),
  })
  const response = await worker.fetch(request, env)
  assert.equal(response.status, 503)
})

test('pagamento não aceita pedido inexistente', async () => {
  const fakeDb = { prepare: () => ({ bind: () => ({ first: async () => null }) }) }
  const request = new Request('https://api.kombine.shop/api/payments/card', {
    method: 'POST', headers: { Origin: 'https://kombine.shop', 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'KMB-123456', amount: 10, payer: { email: 'test@example.com' }, token: 'fake', paymentMethodId: 'visa', method: 'credito' }),
  })
  const response = await worker.fetch(request, { ...env, DB: fakeDb })
  assert.equal(response.status, 409)
})

test('admin endpoint exige banco D1 configurado', async () => {
  const request = new Request('https://api.kombine.shop/api/admin/auth/session', { headers: { Origin: 'https://kombine.shop' } })
  const response = await worker.fetch(request, env)
  assert.equal(response.status, 503)
})


test('preço do pedido é calculado pelo servidor usando catálogo e cupom permitido', async () => {
  const state = {
    products: [{ id: 'p01', name: 'Produto teste', slug: 'produto-teste', category: 'Roupas', price: 100, stock: 5, art: 'camiseta-kombi', sales: 0 }],
    settings: { freeShippingMin: 50, shippingFee: 10, pixDiscount: 10 }, orders: [], seedVersion: 4,
  }
  const orders = new Map()
  const db = {
    prepare(sql) {
      let args = []
      const stmt = {
        bind(...values) { args = values; return stmt },
        async first() {
          if (sql.includes('SELECT state_json FROM store_state')) return { state_json: JSON.stringify(state) }
          if (sql.includes('SELECT state_json,status,payment_id FROM orders WHERE id=?')) {
            const o = orders.get(args[0]); return o ? { state_json: JSON.stringify(o), status: o.status, payment_id: null } : null
          }
          return null
        },
        async all() { return { results: [] } },
        async run() {
          if (sql.startsWith('INSERT INTO orders')) orders.set(args[0], JSON.parse(args[1]))
          return { success: true }
        },
      }
      return stmt
    },
  }
  const request = new Request('https://api.kombine.shop/api/orders', {
    method: 'POST', headers: { Origin: 'https://kombine.shop', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Maria Teste', email: 'maria@example.com', phone: '11999999999', cpf: '52998224725', zip: '01001000', address: 'Rua A', number: '10', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' },
      items: [{ productId: 'p01', qty: 1, variant: 'M' }], method: 'credito', coupon: 'KOMBINE10',
    }),
  })
  const response = await worker.fetch(request, { ...env, DB: db })
  assert.equal(response.status, 201)
  const order = await response.json()
  assert.equal(order.total, 90)
  assert.equal(orders.get(order.id).items[0].price, 100)
})

test('primeiro login usa senha temporária e força troca de senha', async () => {
  let admin = null
  const sessions = new Map()
  const attempts = []
  const db = {
    prepare(sql) {
      let args = []
      const stmt = {
        bind(...values) { args = values; return stmt },
        async first() {
          if (sql.includes('SELECT id FROM admin_users')) return admin ? { id: 1 } : null
          if (sql.includes('SELECT * FROM admin_users')) return admin
          if (sql.includes('SELECT COUNT(*) AS n FROM admin_login_attempts')) return { n: attempts.filter((a) => a.ip === args[0] && a.at > args[1] && !a.success).length }
          if (sql.includes('SELECT token_hash FROM admin_sessions')) return sessions.has(args[0]) ? { token_hash: args[0] } : null
          if (sql.includes('SELECT must_change_password FROM admin_users')) return admin ? { must_change_password: admin.must_change_password } : null
          return null
        },
        async all() { return { results: [] } },
        async run() {
          if (sql.startsWith('INSERT INTO admin_users')) admin = { id: 1, password_salt: args[0], password_hash: args[1], must_change_password: args[2], updated_at: args[3] }
          if (sql.startsWith('UPDATE admin_users')) admin = { ...admin, password_salt: args[0], password_hash: args[1], must_change_password: args[2], updated_at: args[3] }
          if (sql.startsWith('INSERT INTO admin_login_attempts')) attempts.push({ ip: args[0], at: args[1], success: args[2] === 1 })
          if (sql.startsWith('INSERT INTO admin_sessions')) sessions.set(args[0], { expires: args[1] })
          if (sql.startsWith('DELETE FROM admin_sessions')) sessions.clear()
          return { success: true }
        },
      }
      return stmt
    },
  }
  const login = await worker.fetch(new Request('https://api.kombine.shop/api/admin/auth/login', {
    method: 'POST', headers: { Origin: 'https://kombine.shop', 'Content-Type': 'application/json' }, body: JSON.stringify({ password: '123456' }),
  }), { ...env, DB: db, ADMIN_SESSION_SECRET: 'test-secret-long-random-value-for-unit-test' })
  assert.equal(login.status, 200)
  assert.match(login.headers.get('set-cookie'), /HttpOnly/)
  assert.match(login.headers.get('set-cookie'), /SameSite=Lax/)
  assert.equal((await login.json()).mustChangePassword, true)
})
