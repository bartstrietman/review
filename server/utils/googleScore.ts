// Fetch a business's current Google rating + review count via Serper.dev
// (same provider as /api/places). Serper has no direct Place-ID lookup, so we
// search by name + city and match on the stored placeId — if there's no exact
// match we return null rather than ever logging the wrong business's numbers.

interface SerperPlace {
  placeId?: string
  rating?: number
  ratingCount?: number
}

export interface GoogleScore {
  rating: number | null
  reviewCount: number | null
}

export async function fetchGoogleScore(opts: {
  serperKey: string
  placeId: string
  companyName: string
  city: string
}): Promise<GoogleScore | null> {
  if (!opts.serperKey || !opts.placeId || !opts.companyName) return null
  try {
    const res = await $fetch<{ places?: SerperPlace[] }>('https://google.serper.dev/maps', {
      method: 'POST',
      headers: { 'X-API-KEY': opts.serperKey, 'Content-Type': 'application/json' },
      body: { q: `${opts.companyName} ${opts.city}`.trim(), gl: 'nl', hl: 'nl' },
    })
    const hit = res.places?.find(p => p.placeId === opts.placeId)
    if (!hit) return null
    return { rating: hit.rating ?? null, reviewCount: hit.ratingCount ?? null }
  }
  catch {
    return null
  }
}
