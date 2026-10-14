/* Gera os ícones do PWA usando a logo oficial Kombine (PNG transparente). */
import { readFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'

const source = readFileSync(new URL('../public/logo.png', import.meta.url))
const outDir = new URL('../public/icons/', import.meta.url)
mkdirSync(outDir, { recursive: true })

for (const { name, size, pad } of [
  { name: 'icon-192.png', size: 192, pad: 0.06 },
  { name: 'icon-512.png', size: 512, pad: 0.06 },
  { name: 'icon-maskable-512.png', size: 512, pad: 0.16 },
]) {
  const inner = Math.round(size * (1 - pad * 2))
  const resized = await sharp(source).resize(inner, inner, { fit: 'inside', withoutEnlargement: false }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 245, b: 250, alpha: 1 } } })
    .composite([{ input: resized, gravity: 'centre' }]).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(new URL(name, outDir).pathname)
  console.log('✓', name)
}
