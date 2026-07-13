// Brand-color scan: fetch a customer's homepage and extract likely brand
// colors from meta tags, inline styles and (a few) same-origin stylesheets.
// Pure text parsing — no canvas/image decoding, so it runs fine on Workers.

const BLOCKED_HOST = /^(localhost|.*\.(local|internal|test)|\[.*\]|\d{1,3}(\.\d{1,3}){3})$/i
const HTML_MAX_BYTES = 1_000_000
const CSS_MAX_BYTES = 300_000
const MAX_STYLESHEETS = 3

export function normalizeSiteUrl(input: string): URL | null {
  let raw = input.trim()
  if (!raw) return null
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  let u: URL
  try { u = new URL(raw) }
  catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (BLOCKED_HOST.test(u.hostname) || !u.hostname.includes('.')) return null
  if (u.port && !['80', '443'].includes(u.port)) return null
  return u
}

async function fetchText(url: string, maxBytes: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReviewUpgrade brand-scan)' },
    })
    if (!res.ok || !res.body) return null
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
    reader.cancel().catch(() => {})
    const buf = new Uint8Array(Math.min(size, maxBytes))
    let off = 0
    for (const c of chunks) {
      const part = c.subarray(0, Math.min(c.length, buf.length - off))
      buf.set(part, off)
      off += part.length
      if (off >= buf.length) break
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(buf)
  }
  catch {
    return null
  }
}

function normHex(raw: string): string | null {
  const v = raw.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase()
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase()
  }
  return null
}

function hexToRgb(hex: string): [number, number, number] {
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)]
}

function saturationLightness(r: number, g: number, b: number): { s: number; l: number } {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
  return { s, l }
}

/** WCAG relative luminance (0..1). */
function relativeLuminance(hex: string): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Usable as a brand/background color: not near-white/black, not grey. */
function isBrandish(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  const { s, l } = saturationLightness(r, g, b)
  return l <= 0.9 && l >= 0.08 && s >= 0.18
}

function rgbDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

const BRAND_PROP = /--(?:[a-z0-9-]*)?(?:brand|primary|accent|main|theme)(?:[a-z0-9-]*)?\s*:\s*(#[0-9a-f]{3,6})\b/gi
const ANY_HEX = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi
const RGB_FN = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)/gi

function collect(css: string, scores: Map<string, number>, add: (hex: string, pts: number) => void) {
  for (const m of css.matchAll(BRAND_PROP)) {
    const hex = normHex(m[1]!)
    if (hex) add(hex, 25)
  }
  for (const m of css.matchAll(ANY_HEX)) {
    const hex = normHex(m[0])
    if (hex) add(hex, 1)
  }
  for (const m of css.matchAll(RGB_FN)) {
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (r > 255 || g > 255 || b > 255) continue
    const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    add(hex, 1)
  }
}

export interface BrandScanResult {
  colors: string[]
  suggestedBg: string | null
  suggestedText: string | null
}

export async function scanBrandColors(input: string): Promise<BrandScanResult> {
  const empty: BrandScanResult = { colors: [], suggestedBg: null, suggestedText: null }
  const site = normalizeSiteUrl(input)
  if (!site) return empty

  const html = await fetchText(site.href, HTML_MAX_BYTES)
  if (!html) return empty

  const scores = new Map<string, number>()
  const add = (hex: string, pts: number) => scores.set(hex, (scores.get(hex) ?? 0) + pts)

  // Highest-confidence signals: explicit brand color meta tags.
  for (const m of html.matchAll(/<meta[^>]+name=["'](?:theme-color|msapplication-TileColor)["'][^>]*>/gi)) {
    const c = m[0].match(/content=["']([^"']+)["']/i)?.[1]
    const hex = c ? normHex(c) : null
    if (hex) add(hex, 40)
  }

  // Inline <style> blocks + style="" attributes.
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) collect(m[1]!, scores, add)
  for (const m of html.matchAll(/style=["']([^"']+)["']/gi)) collect(m[1]!, scores, add)

  // A few same-origin stylesheets (Workers subrequest budget: hard cap).
  const hrefs: string[] = []
  for (const m of html.matchAll(/<link[^>]+>/gi)) {
    const tag = m[0]
    if (!/rel=["']?[^"'>]*stylesheet/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    try {
      const u = new URL(href, site.href)
      if (u.origin === site.origin && (u.protocol === 'https:' || u.protocol === 'http:')) hrefs.push(u.href)
    }
    catch { /* skip */ }
    if (hrefs.length >= MAX_STYLESHEETS) break
  }
  const sheets = await Promise.all(hrefs.map(h => fetchText(h, CSS_MAX_BYTES)))
  for (const css of sheets) if (css) collect(css, scores, add)

  // Filter to usable brand colors and merge near-duplicates into the strongest.
  const ranked = [...scores.entries()]
    .filter(([hex]) => isBrandish(hex))
    .sort((a, b) => b[1] - a[1])
  const picked: string[] = []
  for (const [hex] of ranked) {
    if (picked.some(p => rgbDistance(p, hex) < 40)) continue
    picked.push(hex)
    if (picked.length >= 6) break
  }

  if (!picked.length) return empty
  const suggestedBg = picked[0]!
  const suggestedText = relativeLuminance(suggestedBg) > 0.179 ? '#1A1A1A' : '#FFFFFF'
  return { colors: picked, suggestedBg, suggestedText }
}
