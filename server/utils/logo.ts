// Copies a remote logo image (found via brand-scan or supplied by hand) into the
// `logos` storage bucket, so customer branding no longer depends on a third-party
// site staying up. Best-effort: any failure returns null, never throws.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { normalizeSiteUrl } from './brandColors'

const MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 2
const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function copyLogoToStorage(
  admin: SupabaseClient<Database>,
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

  const buf = new Uint8Array(await res.arrayBuffer())
  if (!buf.byteLength || buf.byteLength > MAX_BYTES) return null

  const path = `${customerId}/${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await admin.storage.from('logos').upload(path, buf, { contentType, upsert: false })
  if (error) return null

  return admin.storage.from('logos').getPublicUrl(path).data.publicUrl
}
