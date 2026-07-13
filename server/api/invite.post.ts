import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseSession } from '#supabase/server'
import { renderInviteEmail, type InviteTexts } from '~~/shared/utils/inviteEmail'

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

  const userHeaders = { apikey: supaKey, Authorization: `Bearer ${token}` }
  const rows = await $fetch<{ id: string; company_name: string | null; slug: string; bg_color: string | null; text_color: string | null; invite_texts: InviteTexts | null }[]>(
    `${supaUrl}/rest/v1/customers?slug=eq.${encodeURIComponent(body.slug)}&select=id,company_name,slug,bg_color,text_color,invite_texts`,
    { headers: userHeaders },
  )
  const customer = rows?.[0]
  if (!customer) throw createError({ statusCode: 403, statusMessage: 'Geen toegang tot dit bedrijf' })

  const origin = getRequestURL(event).origin
  const reviewUrl = `${origin}/r/${customer.slug}`
  const company = customer.company_name || 'ons'
  const message = body.message?.trim() || ''

  // Send one email per recipient (privacy: no shared To). Each recipient gets an
  // invites row first; its id doubles as the tracking token in the link + pixel.
  let sent = 0
  const failed: string[] = []
  for (const to of body.emails) {
    // Log the invite (insert under the user's JWT; RLS enforces ownership).
    // Logging failure must never block sending — fall back to an untracked mail.
    let inviteId: string | null = null
    try {
      const created = await $fetch<{ id: string }[]>(`${supaUrl}/rest/v1/invites`, {
        method: 'POST',
        headers: { ...userHeaders, Prefer: 'return=representation' },
        body: { customer_id: customer.id, email: to, message: message || null },
      })
      inviteId = created?.[0]?.id ?? null
    }
    catch { /* untracked send */ }

    const { subject, html } = renderInviteEmail({
      company,
      reviewUrl: inviteId ? `${reviewUrl}?i=${inviteId}` : reviewUrl,
      texts: customer.invite_texts,
      message,
      pixelUrl: inviteId ? `${origin}/t/${inviteId}` : undefined,
      bgColor: customer.bg_color,
      textColor: customer.text_color,
    })

    let ok = false
    try {
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
        body: { from: config.resendFrom, to, subject, html },
      })
      ok = true
      sent++
    }
    catch {
      failed.push(to)
    }

    if (inviteId) {
      try {
        await $fetch(`${supaUrl}/rest/v1/rpc/mark_invite_sent`, {
          method: 'POST',
          headers: userHeaders,
          body: { p_invite: inviteId, p_ok: ok },
        })
      }
      catch { /* status stays pending; the send itself already happened */ }
    }
  }

  return { sent, failed }
})
