import { z } from 'zod'

const bodySchema = z.object({
  q: z.string().min(2).max(200),
})

interface SerperPlace {
  title?: string
  address?: string
  phoneNumber?: string
  website?: string
  placeId?: string
  cid?: string
  rating?: number
  ratingCount?: number
  latitude?: number
  longitude?: number
}

// Best-effort NL address split: "Willemsstraat 4, 1015 JD Amsterdam, Nederland"
function parseAddress(address: string | undefined) {
  const out = { street: '', postcode: '', city: '' }
  if (!address) return out
  const parts = address.split(',').map(p => p.trim()).filter(p => p && !/^nederland$/i.test(p))
  if (parts.length) out.street = parts[0] ?? ''
  const rest = parts.slice(1).join(', ')
  const m = rest.match(/(\d{4}\s?[A-Za-z]{2})\s+(.+)/)
  if (m) {
    out.postcode = (m[1] ?? '').toUpperCase()
    out.city = m[2] ?? ''
  }
  else if (parts.length > 1) {
    out.city = parts[parts.length - 1] ?? ''
  }
  return out
}

export default defineEventHandler(async (event) => {
  const { serperKey } = useRuntimeConfig()
  if (!serperKey) {
    throw createError({ statusCode: 503, statusMessage: 'Search is not configured' })
  }

  const { q } = await readValidatedBody(event, bodySchema.parse)

  let res: { places?: SerperPlace[] }
  try {
    res = await $fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: { q, gl: 'nl', hl: 'nl' },
    })
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Search failed' })
  }

  const results = (res.places ?? []).slice(0, 6).map((p) => {
    const addr = parseAddress(p.address)
    return {
      title: p.title ?? '',
      address: p.address ?? '',
      street: addr.street,
      postcode: addr.postcode,
      city: addr.city,
      phone: p.phoneNumber ?? '',
      website: p.website ?? '',
      placeId: p.placeId ?? '',
      rating: p.rating ?? null,
      ratingCount: p.ratingCount ?? null,
      // Direct "write a review" deep link for this place.
      reviewUrl: p.placeId ? `https://search.google.com/local/writereview?placeid=${p.placeId}` : '',
    }
  })

  return { results }
})
