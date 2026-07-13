import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseSession, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { scanBrandColors } from '../utils/brandColors'
import { copyLogoToStorage } from '../utils/logo'

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
})

// Re-scans a customer's website for a logo and stores it — used right after
// self-signup, where the initial brand-scan (step 2/3) never persisted one.
// Best-effort throughout: never throws past a skip reason, so it's safe to
// call fire-and-forget from the signup flow without blocking the redirect.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })

  const body = await readValidatedBody(event, bodySchema.parse)

  // Ownership-check under the user's own JWT (pattern: invite.post.ts) — RLS
  // only returns the row if it's theirs (or they're admin).
  const session = await serverSupabaseSession(event)
  const token = session?.access_token
  const supaUrl = process.env.SUPABASE_URL
  const supaKey = process.env.SUPABASE_KEY
  if (!token || !supaUrl || !supaKey) throw createError({ statusCode: 401, statusMessage: 'Sessie ontbreekt' })

  const userHeaders = { apikey: supaKey, Authorization: `Bearer ${token}` }
  const rows = await $fetch<{ id: string; website: string | null; logo_url: string | null }[]>(
    `${supaUrl}/rest/v1/customers?slug=eq.${encodeURIComponent(body.slug)}&select=id,website,logo_url`,
    { headers: userHeaders },
  )
  const customer = rows?.[0]
  if (!customer) throw createError({ statusCode: 403, statusMessage: 'Geen toegang tot dit bedrijf' })

  if (customer.logo_url) return { skipped: 'has-logo' as const }
  if (!customer.website) return { skipped: 'no-website' as const }

  try {
    const scan = await scanBrandColors(customer.website)
    if (!scan.logo) return { skipped: 'no-logo' as const }

    const admin = serverSupabaseServiceRole<Database>(event)
    const logo_url = await copyLogoToStorage(admin, customer.id, scan.logo)
    if (!logo_url) return { skipped: 'no-logo' as const }

    await admin.from('customers').update({ logo_url }).eq('id', customer.id)
    return { logo_url }
  }
  catch {
    return { skipped: 'error' as const }
  }
})
