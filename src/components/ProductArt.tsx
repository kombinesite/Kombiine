import type { CSSProperties } from 'react'

/**
 * Ilustrações vetoriais dos produtos — identidade KOMBINE em tons de rosa.
 * Cada arte é desenhada em viewBox 400x400 com fundo em gradiente suave.
 */

const P = {
  light: '#FFD0E5',
  mid: '#FF9FC9',
  main: '#FF7BB4',
  deep: '#F4308C',
  dark: '#C2256F',
  ink: '#3A1B2C',
  white: '#FFFFFF',
  gold: '#FFB13D',
  cream: '#FFF5FA',
}

function Frame({ children, from = '#FFF0F7', to = '#FFD9EC' }: { children: React.ReactNode; from?: string; to?: string }) {
  return (
    <>
      <defs>
        <linearGradient id="artBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="32" fill="url(#artBg)" />
      <circle cx="320" cy="70" r="90" fill="#FFFFFF" opacity="0.25" />
      <circle cx="60" cy="350" r="70" fill="#FFFFFF" opacity="0.2" />
      {children}
    </>
  )
}

const arts: Record<string, () => React.JSX.Element> = {
  'vestido-midi': () => (
    <Frame>
      <path d="M160 70 q40 -18 80 0 l30 34 -22 26 -18 -14 v190 q-30 16 -60 0 v-190 l-18 14 -22 -26 z" fill={P.main} />
      <path d="M160 70 q40 -18 80 0 l30 34 -22 26 -18 -14 v40 q-40 22 -80 0 v-40 l-18 14 -22 -26 z" fill={P.deep} />
      <path d="M170 170 q30 14 60 0" stroke={P.white} strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M150 300 q50 22 100 0 l14 34 q-64 26 -128 0 z" fill={P.light} />
      <circle cx="200" cy="146" r="13" fill={P.white} />
      <path d="M200 152 c0 0 -8 -6 -8 -12 a8 8 0 0 1 16 0 c0 6 -8 12 -8 12 z" fill={P.gold} />
    </Frame>
  ),
  'cropped-panda': () => (
    <Frame>
      <path d="M130 120 q70 -30 140 0 l34 40 -26 30 -22 -16 v140 q-60 24 -120 0 v-140 l-22 16 -26 -30 z" fill={P.white} />
      <path d="M130 120 q70 -30 140 0 l10 12 q-80 -24 -160 0 z" fill={P.light} />
      <path d="M200 190 c-6 -10 -24 -12 -24 -28 a15 15 0 0 1 24 -10 a15 15 0 0 1 24 10 c0 16 -18 18 -24 28 z" fill={P.deep} />
      <circle cx="200" cy="238" r="26" fill={P.white} stroke={P.ink} strokeWidth="3" />
      <circle cx="182" cy="222" r="9" fill={P.ink} />
      <circle cx="218" cy="222" r="9" fill={P.ink} />
      <ellipse cx="191" cy="238" rx="5" ry="6" fill={P.ink} />
      <ellipse cx="209" cy="238" rx="5" ry="6" fill={P.ink} />
      <circle cx="200" cy="250" r="3.5" fill={P.ink} />
      <circle cx="226" cy="215" r="7" fill={P.main} />
    </Frame>
  ),
  'moletom-oversized': () => (
    <Frame>
      <path d="M124 128 q76 -34 152 0 l40 44 -30 34 -26 -20 v132 q-60 26 -120 0 v-132 l-26 20 -30 -34 z" fill={P.mid} />
      <path d="M164 118 q36 26 72 0 l16 12 q-52 34 -104 0 z" fill={P.light} />
      <rect x="146" y="288" width="108" height="18" rx="9" fill={P.deep} />
      <rect x="150" y="182" width="100" height="66" rx="14" fill={P.deep} opacity="0.85" />
      <text x="200" y="226" textAnchor="middle" fontFamily="Pacifico, cursive" fontSize="34" fill={P.white}>kombine</text>
      <path d="M200 118 v-18" stroke={P.deep} strokeWidth="8" strokeLinecap="round" />
      <circle cx="192" cy="94" r="7" fill={P.deep} />
      <circle cx="208" cy="94" r="7" fill={P.deep} />
    </Frame>
  ),
  'camiseta-kombi': () => (
    <Frame>
      <path d="M128 122 q72 -30 144 0 l36 40 -28 32 -24 -18 v138 q-56 24 -112 0 v-138 l-24 18 -28 -32 z" fill={P.white} />
      <path d="M128 122 q72 -30 144 0 l8 10 q-80 -22 -160 0 z" fill={P.light} />
      <g transform="translate(168 180) scale(0.32)">
        <rect x="20" y="80" width="200" height="120" rx="24" fill={P.main} />
        <rect x="20" y="130" width="200" height="70" rx="18" fill={P.deep} />
        <rect x="44" y="98" width="56" height="42" rx="10" fill={P.light} />
        <rect x="140" y="98" width="56" height="42" rx="10" fill={P.light} />
        <circle cx="58" cy="200" r="18" fill={P.ink} />
        <circle cx="182" cy="200" r="18" fill={P.ink} />
        <path d="M0 200 h240" stroke={P.ink} strokeWidth="10" strokeLinecap="round" />
      </g>
      <text x="200" y="300" textAnchor="middle" fontFamily="Pacifico, cursive" fontSize="30" fill={P.deep}>ride pink</text>
    </Frame>
  ),
  'tenis-chunky': () => (
    <Frame from="#FFEAF4" to="#FFC9E2">
      <path d="M70 250 q30 -18 70 -20 l40 -60 q26 34 62 48 l60 22 q28 10 28 34 v18 q0 12 -14 12 H90 q-20 0 -20 -22 z" fill={P.white} />
      <path d="M70 250 q30 -18 70 -20 l14 20 q-52 8 -74 22 z" fill={P.light} />
      <path d="M180 170 q30 30 66 44" stroke={P.deep} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M150 224 q46 -8 96 22" stroke={P.mid} strokeWidth="9" fill="none" strokeLinecap="round" />
      <rect x="64" y="290" width="272" height="26" rx="13" fill={P.deep} />
      <rect x="64" y="290" width="272" height="12" rx="6" fill={P.main} />
      <path d="M292 240 q22 6 30 26" stroke={P.gold} strokeWidth="9" fill="none" strokeLinecap="round" />
    </Frame>
  ),
  'sandalia-bloco': () => (
    <Frame>
      <path d="M120 120 q60 -26 120 0 l-8 20 q-46 -18 -84 0 z" fill={P.deep} />
      <path d="M132 140 q40 -16 78 0 l12 150 q-52 20 -102 0 z" fill={P.main} opacity="0.55" />
      <path d="M120 300 q52 20 102 0 l6 24 q-58 24 -114 0 z" fill={P.deep} />
      <path d="M222 322 l22 46 q-8 10 -22 6 l-16 -44 z" fill={P.dark} />
      <circle cx="182" cy="128" r="14" fill={P.gold} />
      <circle cx="182" cy="128" r="6" fill={P.white} />
    </Frame>
  ),
  'bolsa-tote': () => (
    <Frame from="#FFF0F7" to="#FFD3E8">
      <path d="M110 150 h180 l18 170 q2 20 -18 20 H110 q-20 0 -18 -20 z" fill={P.main} />
      <path d="M110 150 h180 l6 56 H104 z" fill={P.deep} />
      <path d="M150 150 v-24 a50 50 0 0 1 100 0 v24" fill="none" stroke={P.dark} strokeWidth="12" strokeLinecap="round" />
      <circle cx="200" cy="252" r="34" fill={P.white} opacity="0.92" />
      <path d="M200 272 c0 0 -16 -12 -16 -22 a16 16 0 0 1 32 0 c0 10 -16 22 -16 22 z" fill={P.deep} />
    </Frame>
  ),
  'mochila-kombi': () => (
    <Frame>
      <rect x="120" y="120" width="160" height="210" rx="36" fill={P.main} />
      <path d="M120 190 h160 v-40 a80 80 0 0 0 -160 0 z" fill={P.deep} />
      <rect x="146" y="238" width="108" height="70" rx="18" fill={P.white} opacity="0.92" />
      <rect x="186" y="222" width="28" height="18" rx="6" fill={P.dark} />
      <path d="M160 120 v-16 a40 40 0 0 1 80 0 v16" fill="none" stroke={P.dark} strokeWidth="12" />
      <path d="M104 200 q-14 60 8 116" fill="none" stroke={P.dark} strokeWidth="10" strokeLinecap="round" />
      <path d="M296 200 q14 60 -8 116" fill="none" stroke={P.dark} strokeWidth="10" strokeLinecap="round" />
      <circle cx="200" cy="272" r="12" fill={P.gold} />
    </Frame>
  ),
  'carteira-couro': () => (
    <Frame from="#FFE9F3" to="#FFC4DF">
      <rect x="96" y="140" width="208" height="140" rx="22" fill={P.deep} />
      <rect x="96" y="140" width="208" height="36" rx="18" fill={P.dark} />
      <rect x="96" y="212" width="208" height="10" fill={P.dark} opacity="0.5" />
      <circle cx="200" cy="240" r="26" fill={P.white} />
      <path d="M200 256 c0 0 -14 -11 -14 -20 a14 14 0 0 1 28 0 c0 9 -14 20 -14 20 z" fill={P.deep} />
      <path d="M258 176 h30" stroke={P.gold} strokeWidth="8" strokeLinecap="round" />
    </Frame>
  ),
  'oculos-coracao': () => (
    <Frame>
      <g transform="translate(200 200)">
        <path d="M-96 -34 a46 46 0 1 1 92 0 a46 46 0 0 1 -92 68 a46 46 0 0 1 -0 -68 z" fill={P.deep} transform="rotate(45 -48 -8) scale(0.9)" />
        <path d="M4 -34 a46 46 0 1 1 92 0 a46 46 0 0 1 -92 68 a46 46 0 0 1 -0 -68 z" fill={P.deep} transform="rotate(45 44 -8) scale(0.9)" />
        <path d="M-8 -12 h16" stroke={P.dark} strokeWidth="10" strokeLinecap="round" />
        <path d="M-100 -24 l-28 -14M92 -24 l28 -14" stroke={P.dark} strokeWidth="10" strokeLinecap="round" />
        <path d="M-72 -34 a22 22 0 0 1 24 -8" stroke={P.white} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M24 -34 a22 22 0 0 1 24 -8" stroke={P.white} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
    </Frame>
  ),
  'relogio-rose': () => (
    <Frame from="#FFF0F7" to="#FFD6EA">
      <rect x="172" y="60" width="56" height="120" rx="22" fill={P.deep} />
      <rect x="172" y="220" width="56" height="120" rx="22" fill={P.deep} />
      <circle cx="200" cy="200" r="86" fill={P.white} stroke={P.gold} strokeWidth="10" />
      <circle cx="200" cy="200" r="68" fill={P.cream} />
      <path d="M200 200 v-42M200 200 l30 22" stroke={P.ink} strokeWidth="8" strokeLinecap="round" />
      <circle cx="200" cy="200" r="7" fill={P.deep} />
      <path d="M200 146 v10M254 200 h-10M200 254 v-10M146 200 h10" stroke={P.deep} strokeWidth="6" strokeLinecap="round" />
    </Frame>
  ),
  'colar-panda': () => (
    <Frame>
      <path d="M110 120 q90 110 180 0" fill="none" stroke={P.gold} strokeWidth="8" strokeLinecap="round" />
      <path d="M110 120 q90 110 180 0" fill="none" stroke={P.white} strokeWidth="2.5" strokeDasharray="2 12" strokeLinecap="round" />
      <path d="M200 296 c0 0 -40 -30 -40 -54 a40 40 0 0 1 80 0 c0 24 -40 54 -40 54 z" fill={P.deep} />
      <circle cx="200" cy="240" r="20" fill={P.white} />
      <circle cx="186" cy="228" r="7" fill={P.ink} />
      <circle cx="214" cy="228" r="7" fill={P.ink} />
      <ellipse cx="193" cy="240" rx="4" ry="5" fill={P.ink} />
      <ellipse cx="207" cy="240" rx="4" ry="5" fill={P.ink} />
      <path d="M200 216 v-18" stroke={P.gold} strokeWidth="6" strokeLinecap="round" />
    </Frame>
  ),
  'perfume-pink': () => (
    <Frame from="#FFEDF6" to="#FFCCE4">
      <rect x="176" y="84" width="48" height="34" rx="8" fill={P.gold} />
      <rect x="184" y="112" width="32" height="24" fill={P.dark} />
      <path d="M140 150 q60 -18 120 0 v150 q0 30 -30 30 H170 q-30 0 -30 -30 z" fill={P.main} />
      <path d="M140 210 q60 -16 120 0 v90 q0 30 -30 30 H170 q-30 0 -30 -30 z" fill={P.deep} opacity="0.8" />
      <circle cx="200" cy="256" r="30" fill={P.white} opacity="0.92" />
      <text x="200" y="266" textAnchor="middle" fontFamily="Pacifico, cursive" fontSize="26" fill={P.deep}>K</text>
      <circle cx="286" cy="150" r="6" fill={P.white} opacity="0.8" />
      <circle cx="304" cy="176" r="4" fill={P.white} opacity="0.7" />
    </Frame>
  ),
  'skincare-glow': () => (
    <Frame>
      <rect x="110" y="150" width="62" height="160" rx="16" fill={P.mid} />
      <rect x="122" y="122" width="38" height="34" rx="8" fill={P.deep} />
      <rect x="188" y="110" width="54" height="200" rx="14" fill={P.white} />
      <rect x="200" y="86" width="30" height="30" rx="7" fill={P.gold} />
      <rect x="198" y="170" width="34" height="60" rx="8" fill={P.light} />
      <rect x="258" y="182" width="50" height="128" rx="14" fill={P.deep} />
      <rect x="268" y="158" width="30" height="30" rx="8" fill={P.dark} />
      <circle cx="141" cy="222" r="14" fill={P.white} opacity="0.9" />
      <circle cx="283" cy="240" r="12" fill={P.white} opacity="0.85" />
      <path d="M316 120 q10 16 0 26 q-12 -8 0 -26 z" fill={P.gold} />
    </Frame>
  ),
  'vela-kafe': () => (
    <Frame from="#FFF1F6" to="#FFD8E8">
      <path d="M200 118 q22 26 0 48 q-24 -22 0 -48 z" fill={P.gold} />
      <path d="M200 132 q10 14 0 26 q-12 -12 0 -26 z" fill="#FFE9A8" />
      <path d="M200 176 v-16" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
      <rect x="132" y="176" width="136" height="134" rx="18" fill={P.deep} />
      <rect x="132" y="176" width="136" height="26" rx="12" fill={P.dark} />
      <rect x="156" y="222" width="88" height="56" rx="10" fill={P.cream} />
      <text x="200" y="258" textAnchor="middle" fontFamily="Pacifico, cursive" fontSize="24" fill={P.deep}>kombine</text>
    </Frame>
  ),
  'caneca-termica': () => (
    <Frame>
      <path d="M262 190 q44 0 44 40 t-44 40" fill="none" stroke={P.deep} strokeWidth="18" strokeLinecap="round" />
      <path d="M140 120 h120 l-12 200 q-2 18 -20 18 h-56 q-18 0 -20 -18 z" fill={P.mid} />
      <path d="M140 120 h120 l-4 66 H144 z" fill={P.deep} />
      <rect x="132" y="108" width="136" height="22" rx="11" fill={P.dark} />
      <g transform="translate(172 190) scale(0.28)">
        <rect x="20" y="80" width="200" height="120" rx="24" fill={P.white} />
        <rect x="20" y="140" width="200" height="60" rx="16" fill={P.light} />
        <circle cx="60" cy="200" r="16" fill={P.ink} />
        <circle cx="180" cy="200" r="16" fill={P.ink} />
      </g>
      <path d="M156 336 h88" stroke={P.dark} strokeWidth="10" strokeLinecap="round" opacity="0.4" />
    </Frame>
  ),
}

export default function ProductArt({ art, imageUrl, mediaType, className, style }: { art: string; imageUrl?: string; mediaType?: 'image' | 'gif' | 'video'; className?: string; style?: CSSProperties }) {
  const Art = arts[art] ?? arts['camiseta-kombi']
  const safeUrl = imageUrl && /^https:\/\//i.test(imageUrl) ? imageUrl : ''
  const inferredVideo = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(safeUrl)
  const kind = mediaType || (inferredVideo ? 'video' : /\.gif(?:$|[?#])/i.test(safeUrl) ? 'gif' : 'image')
  if (safeUrl && kind === 'video') {
    return <video src={safeUrl} className={className} style={{ objectFit: 'cover', ...style }} autoPlay muted loop playsInline controls preload="metadata" aria-label="Vídeo do produto" />
  }
  if (safeUrl && (kind === 'image' || kind === 'gif')) {
    return <img src={safeUrl} alt="" loading="lazy" decoding="async" className={className} style={{ objectFit: 'cover', ...style }} onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
  }
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} role="img" aria-hidden="true" focusable="false">
      <Art />
    </svg>
  )
}

export const artIds = Object.keys(arts)
