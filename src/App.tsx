import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import InstallPrompt from './components/InstallPrompt'
import Toasts from './components/Toasts'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductPage from './pages/Product'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import NotFound from './pages/NotFound'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminSales from './pages/admin/Sales'
import AdminSettings from './pages/admin/Settings'
import { apiUrl } from './lib/api'
import { useStore } from './store/useStore'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const hydrateFromServer = useStore((s) => s.hydrateFromServer)
  useEffect(() => {
    let alive = true
    fetch(apiUrl('/api/store/state'), { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (alive && data?.initialized !== false && data?.products) hydrateFromServer(data) })
      .catch(() => { /* loja mantém cache local se API estiver indisponível */ })
    return () => { alive = false }
  }, [hydrateFromServer])
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-pink-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-full">
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      {isAdmin ? (
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="vendas" element={<AdminSales />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="conteudo" className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/catalogo/:category" element={<Catalog />} />
              <Route path="/produto/:slug" element={<ProductPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedido/:id" element={<OrderSuccess />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <CartDrawer />
          <InstallPrompt />
        </div>
      )}
      <Toasts />
    </>
  )
}
