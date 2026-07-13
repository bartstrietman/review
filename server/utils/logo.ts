// Copies a remote logo image (found via brand-scan or supplied by hand) into the
// `logos` storage bucket, so customer branding no longer depends on a third-party
// site staying up. Best-effort: any failure returns null, never throws.
import type { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { normalizeSiteUrl } from './brandColors'

const MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 2
const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  // ponytail: SVG stored as-is (shown via <img>, source = customer's own site, admin action).
  // No sanitisation for now; add DOMPurify/SVG-scrub if these ever render inline or from untrusted sources.
  'image/svg+xml': 'svg',
}

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>

export async function copyLogoToStorage(
  admin: AdminClient,
  customerId: string,
  rawUrl: string,
): Promise<string | null> {
  const target = normalizeSiteUrl(rawUrl)
  if (!target) return null

  let res: Response
  try {
    let hops = 0
    let href = target.href
    for (;;) {
      res = await fetch(href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReviewUpgrade brand-scan)' },
      })
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        if (++hops > MAX_REDIRECTS) return null
        const next = normalizeSiteUrl(new URL(res.headers.get('location')!, href).href)
        if (!next) return null
        href = next.href
        continue
      }
      break
    }
  }
  catch {
    return null
  }

  if (!res.ok || !res.body) return null
  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  const ext = CONTENT_TYPE_EXT[contentType]
  if (!ext) return null

  // Reject oversize bodies up front, then stream with a hard cap so a lying or
  // missing content-length can't OOM the worker (arrayBuffer() would buffer it all).
  const declared = Number(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BYTES) return null

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_BYTES) { reader.cancel().catch(() => {}); return null }
      chunks.push(value)
    }
  }
  catch { return null }
  if (!size) return null

  const buf = new Uint8Array(size)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.length }

  const path = `${customerId}/${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await admin.storage.from('logos').upload(path, buf, { contentType, upsert: false })
  if (error) return null

  return admin.storage.from('logos').getPublicUrl(path).data.publicUrl
}
