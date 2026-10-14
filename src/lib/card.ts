const BRANDS: Array<{ name: string; test: (d: string) => boolean }> = [
  { name: 'Elo', test: (d) => /^(4011|4312|4389|5041|5066|5067|6277|6362|6363|650|651|652|653|654|6550|6551|6552|6553|6554|6555|6556|6557|6558|6559|656)/.test(d) },
  { name: 'Visa', test: (d) => /^4/.test(d) },
  { name: 'Mastercard', test: (d) => /^5[1-5]/.test(d) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(d) },
  { name: 'Amex', test: (d) => /^3[47]/.test(d) },
  { name: 'Hipercard', test: (d) => /^(606282|3841)/.test(d) },
  { name: 'JCB', test: (d) => /^35/.test(d) },
  { name: 'Discover', test: (d) => /^(6011|65|64[4-9])/.test(d) },
]

export function detectBrand(digits: string): string | null {
  if (digits.length < 6) return null
  return BRANDS.find((b) => b.test(digits))?.name ?? null
}

export function luhn(digits: string): boolean {
  if (digits.length < 13) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export function expiryValid(mmYY: string): boolean {
  const m = mmYY.slice(0, 2)
  const y = mmYY.slice(3, 5)
  const mm = Number(m)
  const yy = Number(y)
  if (!mm || !yy || mm < 1 || mm > 12) return false
  const now = new Date()
  const exp = new Date(2000 + yy, mm, 0)
  return exp >= new Date(now.getFullYear(), now.getMonth(), 1)
}

export function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}
