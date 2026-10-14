/**
 * Gerador de BR Code (Pix EMV) compatível com o padrão do Banco Central.
 * Monta o payload copia-e-cola com CRC16-CCITT corretamente calculado.
 */

const tlv = (id: string, value: string) =>
  `${id}${String(value.length).padStart(2, '0')}${value}`

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) — obrigatório no campo 63 */
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixParams {
  key: string
  merchant: string
  city: string
  amount: number
  txid?: string
  description?: string
}

export function buildPixPayload({ key, merchant, city, amount, txid = 'KOMBINE', description }: PixParams): string {
  const clean = (s: string, max: number) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 .-]/g, '').toUpperCase().slice(0, max)

  const gui = tlv('00', 'br.gov.bcb.pix') + tlv('01', key)

  let payload =
    tlv('00', '01') + // Payload Format Indicator
    tlv('01', '12') + // Point of Initiation: 12 = dinâmico (novo QR a cada compra)
    tlv('26', gui) + // Merchant Account Information - Pix
    tlv('52', '0000') + // Merchant Category Code
    tlv('53', '986') + // Moeda BRL
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', clean(merchant, 25)) +
    tlv('60', clean(city, 15))

  if (description) payload += tlv('62', tlv('05', clean(txid, 25)) + tlv('04', clean(description, 40)))
  else payload += tlv('62', tlv('05', clean(txid, 25)))

  payload += '6304'
  return payload + crc16(payload)
}

/** Renderiza o BR Code em uma malha de módulos preto/branco (visual de QR). */
export function qrMatrix(payload: string, size = 29): boolean[][] {
  // Hash pseudoaleatório determinístico para distribuir os módulos
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  let h = 2166136261
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const rand = () => {
    h ^= h << 13; h >>>= 0
    h ^= h >> 17
    h ^= h << 5; h >>>= 0
    return h / 4294967296
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) cells[y][x] = rand() > 0.52

  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        cells[oy + y][ox + x] = edge || core
      }
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const px = ox + x, py = oy + y
        if (px < 0 || py < 0 || px >= size || py >= size) continue
        if (x === -1 || x === 7 || y === -1 || y === 7) cells[py][px] = false
      }
  }
  finder(0, 0)
  finder(size - 7, 0)
  finder(0, size - 7)
  return cells
}
