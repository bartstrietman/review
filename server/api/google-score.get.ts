import { serverSupabaseUser, serverSupabaseSession } from '#supabase/server'
import { fetchGoogleScore } from '../utils/googleScore'

// Google-score history for the dashboard. Owner-scoped via the user's own JWT
// (RLS). If there's no snapshot for today yet and a Place ID is linked, we
// fetch a fresh score and record it — so the history builds up on dashboard
// visits without needing the cron job to exist yet.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Snapshot { rating: number | null; review_count: number | null; captured_at: string }

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })

  const customerId = String(getQuery(event).customer_id || '')
  if (!UUID_RE.test(customerId)) throw createError({ statusCode: 400, statusMessage: 'Ongeldig customer_id' })

  const session = await serverSupabaseSession(event)
  const token = session?.access_token
  const supaUrl = process.env.SUPABASE_URL
  const supaKey = process.env.SUPABASE_KEY
  if (!token || !supaUrl || !supaKey) throw createError({ statusCode: 401, statusMessage: 'Sessie ontbreekt' })
  const headers = { apikey: supaKey, Authorization: `Bearer ${token}` }

  const customers = await $fetch<{ id: string; company_name: string | null; city: string | null; google_place_id: string | null }[]>(
    `${supaUrl}/rest/v1/customers?id=eq.${customerId}&select=id,company_name,city,google_place_id`,
    { headers },
  )
  const customer = customers?.[0]
  if (!customer) throw createError({ statusCode: 403, statusMessage: 'Geen toegang tot dit bedrijf' })

  let history = await $fetch<Snapshot[]>(
    `${supaUrl}/rest/v1/google_review_snapshots?customer_id=eq.${customerId}&select=rating,review_count,captured_at&order=captured_at.asc`,
    { headers },
  )

  const placeLinked = !!customer.google_place_id
  const today = new Date().toISOString().slice(0, 10)
  const hasToday = history.some(s => s.captured_at.slice(0, 10) === today)

  if (placeLinked && !hasToday) {
    const config = useRuntimeConfig()
    const score = await fetchGoogleScore({
      serperKey: config.serperKey,
      placeId: customer.google_place_id!,
      companyName: customer.company_name || '',
      city: customer.city || '',
    })
    if (score && (score.rating != null || score.reviewCount != null)) {
      try {
        await $fetch(`${supaUrl}/rest/v1/rpc/record_google_snapshot`, {
          method: 'POST',
          headers,
          body: { p_customer: customerId, p_rating: score.rating, p_count: score.reviewCount, p_source: 'refresh' },
        })
        history = [
          ...history.filter(s => s.captured_at.slice(0, 10) !== today),
          { rating: score.rating, review_count: score.reviewCount, captured_at: new Date().toISOString() },
        ]
      }
      catch { /* score tonen kan ook zonder opgeslagen snapshot */ }
    }
  }

  return { placeLinked, history }
})
