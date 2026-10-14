export const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const brlCompact = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

export const dateBR = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const dateTimeBR = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

export const formatPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/[-()]\s*$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/[-()]\s*$/, '')
}

export const formatCpf = (s: string) =>
  onlyDigits(s).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')

export const formatCep = (s: string) => onlyDigits(s).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')

export const formatCard = (s: string) =>
  onlyDigits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')
