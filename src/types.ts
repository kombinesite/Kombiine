export type Category = 'Roupas' | 'Calçados' | 'Bolsas' | 'Acessórios' | 'Beleza' | 'Casa'

export interface Product {
  id: string
  slug: string
  name: string
  category: Category
  price: number
  oldPrice?: number
  promo?: boolean
  bestseller?: boolean
  rating: number
  reviews: number
  stock: number
  sales: number
  art: string
  imageUrl?: string
  mediaType?: 'image' | 'gif' | 'video'
  tagline: string
  description: string
  highlights: string[]
  variants: { label: string; options: string[] }
  createdAt: string
}

export interface CartItem {
  productId: string
  qty: number
  variant: string
}

export type OrderStatus = 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado'
export type PaymentMethod = 'pix' | 'credito' | 'debito'

export interface Order {
  id: string
  createdAt: string
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
    address: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
  items: Array<CartItem & { name: string; price: number; art: string; imageUrl?: string; mediaType?: 'image' | 'gif' | 'video' }>
  payment: {
    method: PaymentMethod
    installments?: number
    last4?: string
    brand?: string
    /** ID do pagamento no gateway (Mercado Pago) */
    paymentId?: string
    /** Gateway usado: "demo" = simulação local sem chaves configuradas */
    gateway?: 'mercadopago' | 'demo'
    /** Código Pix copia-e-cola devolvido pelo gateway */
    pixQrCode?: string
  }
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: OrderStatus
}

export interface StoreSettings {
  storeName: string
  announcement: string
  freeShippingMin: number
  shippingFee: number
  pixDiscount: number
  whatsapp: string
  email: string
  address: string
  heroBadge: string
  heroTitle: string
  heroHighlight: string
  heroSubtitle: string
  heroPrimaryCta: string
  heroSecondaryCta: string
  marqueeText: string
  promoCard1Title: string
  promoCard1Text: string
  promoCard1Cta: string
  promoCard2Title: string
  promoCard2Text: string
  promoCard2Cta: string
  promoCard3Title: string
  promoCard3Text: string
  promoCard3Cta: string
  promoBannerLabel: string
  promoBannerTitle: string
  promoBannerDescription: string
  promoBannerButton: string
  feature1Title: string
  feature1Text: string
  feature2Title: string
  feature2Text: string
  feature3Title: string
  feature3Text: string
  feature4Title: string
  feature4Text: string
  shippingPolicy: string
  returnsPolicy: string
  paymentPolicy: string
  seoTitle: string
  seoDescription: string
  categoryTitle: string
  categoryDescription: string
  categoryCta: string
  featuredTitle: string
  featuredDescription: string
  featuredCta: string
  promoSectionTitle: string
  promoSectionDescription: string
  footerDescription: string
  footerHelpShipping: string
  footerHelpReturns: string
  footerHelpPayment: string
  footerCopyright: string
}
