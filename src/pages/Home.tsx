import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useSeo } from '../lib/seo'
import Logo from '../components/Logo'
import ProductCard from '../components/ProductCard'
import ProductArt from '../components/ProductArt'
import Reveal from '../components/Reveal'
import { IconCard, IconInstall, IconPix, IconRefresh, IconShield, IconTruck, IconChevron } from '../components/Icons'
import { CATEGORIES } from '../data/products'
import { brl } from '../lib/format'

const CATEGORY_ART: Record<string, string> = {
  Roupas: 'moletom-oversized',
  Calçados: 'tenis-chunky',
  Bolsas: 'bolsa-tote',
  'Acessórios': 'oculos-coracao',
  Beleza: 'perfume-pink',
  Casa: 'caneca-termica',
}

export default function Home() {
  const products = useStore((s) => s.products)
  const settings = useStore((s) => s.settings)
  useSeo(settings.seoTitle, settings.seoDescription)

  const bestsellers = (products.filter((p) => p.bestseller).length ? products.filter((p) => p.bestseller) : products).slice(0, 4)
  const promos = products.filter((p) => p.promo).slice(0, 4)

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="bg-dots absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-fuchsia-300/25 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-pink-700">
              {settings.heroBadge}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-grape sm:text-5xl lg:text-6xl">
              {settings.heroTitle} <span className="gradient-text">{settings.heroHighlight}</span>.<br />Viaje com estilo.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              {settings.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/catalogo" className="btn-portal px-8 py-4 text-base">
                {settings.heroPrimaryCta} <IconChevron className="h-4 w-4" />
              </Link>
              <Link to="/catalogo/Roupas" className="btn-ghost px-7 py-4 text-base">
                {settings.heroSecondaryCta}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center">
              {[
                ['Estilo', 'com personalidade'],
                ['Praticidade', 'na experiência'],
                ['KOMBINE', 'moda & lifestyle'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-pink-100 bg-white/70 py-3">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-xl font-extrabold text-pink-700">{v}</dd>
                  <dd className="text-[11px] text-ink-soft">{l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-400/40 to-fuchsia-300/40 blur-2xl" aria-hidden="true" />
            <Logo className="relative mx-auto w-full drop-shadow-2xl animate-float" />
          </div>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden border-y border-pink-200 bg-white/60 py-3" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-sm font-bold uppercase tracking-widest text-pink-500">
            {Array.from({ length: 2 }, (_, k) => (
              <span key={k} className="flex gap-10">
                {settings.marqueeText.split('|').map((item, i) => <span key={`${k}-${i}`}>{item.trim().replace('{frete}', brl(settings.freeShippingMin)).replace('{pix}', String(settings.pixDiscount))}<span className="ml-10">💗</span></span>)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CARDS PROMOCIONAIS */}
      <section aria-label="Promoções" className="mx-auto -mt-2 max-w-7xl px-4 pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <IconPix className="h-6 w-6" />, title: settings.promoCard1Title.replace('{pix}', String(settings.pixDiscount)), text: settings.promoCard1Text, cta: settings.promoCard1Cta, to: '/catalogo' },
            { icon: <IconTruck className="h-6 w-6" />, title: settings.promoCard2Title.replace('{frete}', brl(settings.freeShippingMin)), text: settings.promoCard2Text, cta: settings.promoCard2Cta, to: '/catalogo' },
            { icon: <IconCard className="h-6 w-6" />, title: settings.promoCard3Title, text: settings.promoCard3Text, cta: settings.promoCard3Cta, to: '/catalogo' },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 90}>
              <article className="card-premium h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 text-white shadow-portal">
                  {card.icon}
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-grape">{card.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{card.text}</p>
                <Link to={card.to} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-pink-700 hover:gap-2 transition-all">
                  {card.cta} <IconChevron className="h-4 w-4" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section aria-labelledby="titulo-categorias" className="mx-auto max-w-7xl px-4 pt-16">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 id="titulo-categorias" className="font-display text-2xl font-extrabold text-grape sm:text-3xl">
                <span className="gradient-text">{settings.categoryTitle}</span>
              </h2>
              <p className="mt-1 text-ink-soft">{settings.categoryDescription}</p>
            </div>
            <Link to="/catalogo" className="hidden items-center gap-1 text-sm font-bold text-pink-700 hover:gap-2 transition-all sm:inline-flex">
              {settings.categoryCta} <IconChevron className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c} delay={i * 60}>
              <Link to={`/catalogo/${c.toLowerCase()}`} className="group card-premium block overflow-hidden">
                <ProductArt art={CATEGORY_ART[c]} className="aspect-square w-full" />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-display text-sm font-bold text-grape group-hover:text-pink-700">{c}</span>
                  <IconChevron className="h-4 w-4 text-pink-400 transition group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section aria-labelledby="titulo-vendidos" className="mx-auto max-w-7xl px-4 pt-16">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 id="titulo-vendidos" className="font-display text-2xl font-extrabold text-grape sm:text-3xl">
                <span className="gradient-text">{settings.featuredTitle}</span>
              </h2>
              <p className="mt-1 text-ink-soft">{settings.featuredDescription}</p>
            </div>
            <Link to="/catalogo?ordem=ventas" className="hidden items-center gap-1 text-sm font-bold text-pink-700 hover:gap-2 transition-all sm:inline-flex">
              {settings.featuredCta} <IconChevron className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {bestsellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* BANNER PROMOCIONAL */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-700 p-8 text-white shadow-float sm:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-pink-200">{settings.promoBannerLabel}</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  {settings.promoBannerTitle.replace('{pix}', String(settings.pixDiscount))}
                </h2>
                <p className="mt-3 max-w-lg text-pink-100">
                  {settings.promoBannerDescription}
                </p>
                <Link to="/catalogo" className="btn-portal mt-6 inline-flex !bg-white !from-white !to-white px-8 py-4 !text-pink-700">
                  {settings.promoBannerButton}
                </Link>
              </div>
              <div className="hidden justify-end md:flex">
                <ProductArt art="perfume-pink" className="w-56 rotate-6 rounded-3xl shadow-2xl" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* PROMOÇÕES DO CATÁLOGO */}
      {promos.length > 0 && (
        <section aria-labelledby="titulo-promo" className="mx-auto max-w-7xl px-4 pt-16">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <h2 id="titulo-promo" className="font-display text-2xl font-extrabold text-grape sm:text-3xl">
                  <span className="gradient-text">{settings.promoSectionTitle}</span>
                </h2>
                <p className="mt-1 text-ink-soft">{settings.promoSectionDescription}</p>
              </div>
            </div>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {promos.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* DIFERENCIAIS */}
      <section aria-labelledby="titulo-diferenciais" className="mx-auto max-w-7xl px-4 pt-16">
        <Reveal>
          <h2 id="titulo-diferenciais" className="text-center font-display text-2xl font-extrabold text-grape sm:text-3xl">
            Comprar na KOMBINE é <span className="gradient-text">outro nível</span>
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <IconShield className="h-6 w-6" />, t: settings.feature1Title, d: settings.feature1Text },
            { icon: <IconTruck className="h-6 w-6" />, t: settings.feature2Title, d: settings.feature2Text },
            { icon: <IconRefresh className="h-6 w-6" />, t: settings.feature3Title, d: settings.feature3Text },
            { icon: <IconInstall className="h-6 w-6" />, t: settings.feature4Title, d: settings.feature4Text },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 80}>
              <article className="card-premium h-full p-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pink-100 text-pink-700">{f.icon}</span>
                <h3 className="mt-4 font-display font-bold text-grape">{f.t}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{f.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
