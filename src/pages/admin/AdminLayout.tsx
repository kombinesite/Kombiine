import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useSeo } from '../../lib/seo'
import { IconAdmin, IconCard, IconCheck, IconClose, IconShield, IconTruck } from '../../components/Icons'
import { cx } from '../../lib/format'
import { apiUrl } from '../../lib/api'
import { useStore } from '../../store/useStore'

const NAV = [
  { to: '/admin', label: 'Visão geral', icon: <IconCard className="h-5 w-5" />, end: true },
  { to: '/admin/produtos', label: 'Produtos', icon: <IconTruck className="h-5 w-5" /> },
  { to: '/admin/pedidos', label: 'Pedidos', icon: <IconCheck className="h-5 w-5" /> },
  { to: '/admin/vendas', label: 'Vendas', icon: <IconCard className="h-5 w-5" /> },
  { to: '/admin/configuracoes', label: 'Configurações', icon: <IconShield className="h-5 w-5" /> },
]

export default function AdminLayout({ children }: { children?: ReactNode }) {
  useSeo('Painel administrativo — KOMBINE')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [pass, setPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let active = true
    fetch(apiUrl('/api/admin/auth/session'), { credentials: 'include' })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!active) return
        setAuthed(ok && data.authenticated === true)
        setMustChangePassword(Boolean(data.mustChangePassword))
      })
      .catch(() => { if (active) setError('Não foi possível conectar ao serviço administrativo.') })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  const hydrateFromServer = useStore((s) => s.hydrateFromServer)
  useEffect(() => {
    if (!authed || mustChangePassword) return
    let active = true
    fetch(apiUrl('/api/admin/store/state'), { credentials: 'include' })
      .then(async (r) => r.ok ? r.json() : null)
      .then((data) => { if (active && data?.products) hydrateFromServer(data) })
      .catch(() => undefined)
    return () => { active = false }
  }, [authed, mustChangePassword, hydrateFromServer])

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const response = await fetch(apiUrl('/api/admin/auth/login'), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Acesso não autorizado.')
      setAuthed(true); setMustChangePassword(Boolean(data.mustChangePassword)); setPass('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha no login.') }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (newPass !== confirmPass) { setError('As senhas não conferem.'); return }
    try {
      const response = await fetch(apiUrl('/api/admin/auth/password'), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar a senha.')
      setMustChangePassword(false); setNewPass(''); setConfirmPass('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao alterar senha.') }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-pink-100"><p className="text-sm font-semibold text-grape">Verificando acesso seguro…</p></div>

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-pink-100 px-4">
        <form onSubmit={login} className="card-premium w-full max-w-sm p-8 text-center">
          <Logo className="mx-auto h-20 w-20" compact />
          <h1 className="mt-4 font-display text-xl font-extrabold text-grape">Painel KOMBINE</h1>
          <p className="mt-1 text-sm text-ink-soft">Acesso restrito à administração.</p>
          <label htmlFor="admin-pass" className="sr-only">Senha de acesso</label>
          <input id="admin-pass" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError('') }} placeholder="Senha de acesso" autoComplete="current-password" required className="mt-6 w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-center outline-none focus:border-pink-500 focus:bg-white" />
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
          <button type="submit" className="btn-portal mt-5 w-full px-6 py-3.5">Entrar</button>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">Autenticação no servidor, sessão protegida por cookie HttpOnly e limite de tentativas.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-pink-700 hover:underline">← Voltar para a loja</Link>
        </form>
      </div>
    )
  }

  if (mustChangePassword) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-pink-100 px-4">
        <form onSubmit={changePassword} className="card-premium w-full max-w-md p-8">
          <Logo className="mx-auto h-16 w-16" compact />
          <h1 className="mt-4 text-center font-display text-xl font-extrabold text-grape">Defina sua senha definitiva</h1>
          <p className="mt-2 text-center text-sm text-ink-soft">Por segurança, a senha inicial só pode ser usada para este primeiro acesso.</p>
          <label className="mt-5 block text-sm font-bold text-grape">Nova senha<input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required className="mt-1.5 w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3" /></label>
          <label className="mt-4 block text-sm font-bold text-grape">Confirme a nova senha<input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required className="mt-1.5 w-full rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3" /></label>
          <p className="mt-2 text-xs text-ink-soft">Mínimo de 12 caracteres, incluindo letras maiúsculas, minúsculas e números.</p>
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
          <button type="submit" className="btn-portal mt-5 w-full px-6 py-3.5">Salvar senha definitiva</button>
        </form>
      </div>
    )
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition',
      isActive ? 'bg-pink-600 text-white shadow-portal' : 'text-pink-100 hover:bg-white/10 hover:text-white',
    )

  return (
    <div className="flex min-h-screen bg-grape">
      <aside className={cx('fixed inset-y-0 left-0 z-50 w-64 flex-col bg-grape p-5 text-white transition-transform lg:static lg:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo className="h-11 w-11" compact />
            <span className="font-script text-2xl text-pink-300">Kombine</span>
          </Link>
          <button className="rounded-full p-2 hover:bg-white/10 lg:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
            <IconClose />
          </button>
        </div>
        <p className="mt-1 pl-1 text-xs font-bold uppercase tracking-widest text-pink-400">Admin</p>

        <nav aria-label="Menu administrativo" className="mt-6 grid gap-1.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link} onClick={() => setMenuOpen(false)}>
              {n.icon} {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <Link to="/" className="btn-ghost w-full px-4 py-2.5 text-sm !border-pink-500/40 !bg-white/10 !text-pink-100 hover:!bg-white/20">
            Ver loja ↗
          </Link>
          <button
            onClick={async () => { await fetch(apiUrl('/api/admin/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => undefined); setAuthed(false); setPass('') }}
            className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-pink-300 hover:bg-white/10"
          >
            Sair do painel
          </button>
        </div>
      </aside>

      {menuOpen && <button className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/10 bg-grape/95 px-5 py-4 backdrop-blur">
          <button className="rounded-full p-2 text-pink-200 hover:bg-white/10 lg:hidden" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <IconAdmin />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-white">{NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? 'Painel'}</h1>
            <p className="text-xs text-pink-300">Bem-vinda de volta, administração ✨</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-1.5 text-xs font-bold text-pink-200">
            <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" /> Loja online
          </span>
        </header>
        <main className="flex-1 bg-cream p-5 lg:p-8">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
