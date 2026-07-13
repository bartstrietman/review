import { fetchGoogleScore } from './googleScore'

// Shared core for the daily Google-score cron. Fetches a fresh score for every
// trial/active customer with a linked Place ID and logs a snapshot (source
// 'cron') — no dashboard visit needed.
//
// Runs with the service role (no user session), so it inserts straight into
// google_review_snapshots via PostgREST. The record_google_snapshot RPC has an
// ownership check that needs a user JWT we don't have here, so it's not usable
// from the cron. Same service-key-over-REST pattern as inbound-invite.post.ts,
// which keeps this callable from both the HTTP endpoint and the Nitro
// cloudflare:scheduled hook (no H3 event required).

interface Candidate {
  id: string
  company_name: string | null
  city: string | null
  google_place_id: string | null
}

// ponytail: fixed batch size to stay well under the Workers subrequest cap;
// bump if the customer base ever outgrows a few hundred.
const BATCH = 10

export async function logAllGoogleScores(opts: {
  supaUrl: string
  serviceKey: string
  serperKey: string
}): Promise<{ checked: number; logged: number }> {
  const { supaUrl, serviceKey, serperKey } = opts
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  const customers = await $fetch<Candidate[]>(
    `${supaUrl}/rest/v1/customers?google_place_id=not.is.null&status=in.(trial,active)&select=id,company_name,city,google_place_id`,
    { headers },
  )
  if (!customers?.length) return { checked: 0, logged: 0 }

  // Skip anyone who already has a snapshot today (any source). The daily-unique
  // index would reject a duplicate anyway — this just avoids a wasted fetch.
  const today = new Date().toISOString().slice(0, 10)
  const todays = await $fetch<{ customer_id: string }[]>(
    `${supaUrl}/rest/v1/google_review_snapshots?captured_at=gte.${today}T00:00:00Z&select=customer_id`,
    { headers },
  ).catch(() => [])
  const done = new Set((todays || []).map(s => s.customer_id))
  const pending = customers.filter(c => !done.has(c.id))

  let logged = 0
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(async (c) => {
      try {
        const score = await fetchGoogleScore({
          serperKey,
          placeId: c.google_place_id!,
          companyName: c.company_name || '',
          city: c.city || '',
        })
        if (!score || (score.rating == null && score.reviewCount == null)) return false
        await $fetch(`${supaUrl}/rest/v1/google_review_snapshots`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: { customer_id: c.id, rating: score.rating, review_count: score.reviewCount, source: 'cron' },
        })
        return true
      }
      catch {
        // Best-effort: one customer failing (fetch error, race on the daily
        // unique index) must not stop the rest.
        return false
      }
    }))
    logged += results.filter(Boolean).length
  }

  return { checked: customers.length, logged }
}
