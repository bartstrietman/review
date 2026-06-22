import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseSession } from '#supabase/server'

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  emails: z.array(z.string().email()).min(1).max(25),
  message: z.string().max(1000).optional().default(''),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()

  if (!config.resendKey) {
    throw createError({ statusCode: 503, statusMessage: 'E-mailverzending is nog niet geconfigureerd (Resend-key ontbreekt).' })
  }

  // Verify the caller owns this business — query customers with their own JWT so
  // RLS only returns the row if it's theirs (or they're admin).
  const session = await serverSupabaseSession(event)
  const token = session?.access_token
  const supaUrl = process.env.SUPABASE_URL
  const supaKey = process.env.SUPABASE_KEY
  if (!token || !supaUrl || !supaKey) throw createError({ statusCode: 401, statusMessage: 'Sessie ontbreekt' })

  const rows = await $fetch<{ company_name: string | null; slug: string }[]>(
    `${supaUrl}/rest/v1/customers?slug=eq.${encodeURIComponent(body.slug)}&select=company_name,slug`,
    { headers: { apikey: supaKey, Authorization: `Bearer ${token}` } },
  )
  const customer = rows?.[0]
  if (!customer) throw createError({ statusCode: 403, statusMessage: 'Geen toegang tot dit bedrijf' })

  const origin = getRequestURL(event).origin
  const reviewUrl = `${origin}/r/${customer.slug}`
  const company = customer.company_name || 'ons'

  const intro = body.message?.trim()
    ? `<p style="color:#444;white-space:pre-wrap">${escapeHtml(body.message.trim())}</p>`
    : ''

  function emailHtml() {
    return `<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;max-width:480px">
      <h2 style="color:#0F3D2E">Laat een review achter voor ${escapeHtml(company)}</h2>
      <p style="color:#6B6B63">Je wordt uitgenodigd om je ervaring te delen. Het duurt minder dan een minuut.</p>
      ${intro}
      <p style="margin:24px 0">
        <a href="${reviewUrl}" style="background:#0F3D2E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">Geef je beoordeling</a>
      </p>
      <p style="color:#9a958a;font-size:12px">Of open: ${reviewUrl}</p>
    </div>`
  }

  // Send one email per recipient (privacy: no shared To).
  let sent = 0
  const failed: string[] = []
  for (const to of body.emails) {
    try {
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
        body: {
          from: config.resendFrom,
          to,
          subject: `Laat een review achter voor ${company}`,
          html: emailHtml(),
        },
      })
      sent++
    }
    catch {
      failed.push(to)
    }
  }

  return { sent, failed }
})

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))
}
