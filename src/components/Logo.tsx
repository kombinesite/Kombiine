interface LogoProps {
  className?: string
  withWordmark?: boolean
  compact?: boolean
}

/** Marca oficial Kombine fornecida pelo proprietário.
 * Compact usa o ícone do PWA; a versão completa mantém a arte integral e transparente.
 */
export default function Logo({ className = 'h-14 w-14', withWordmark = false, compact = false }: LogoProps) {
  const src = compact ? '/icons/icon-512.png' : '/logo.png'
  return (
    <img
      src={src}
      className={className}
      alt={withWordmark || !compact ? 'Kombine — loja oficial' : 'Kombine'}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  )
}
