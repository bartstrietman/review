import { renderInviteEmail, type InviteTexts } from '~~/shared/utils/inviteEmail'
import { extractInviteEmail } from '~~/shared/utils/extractInviteEmail'
import { resendSend, resendGetReceived, verifyResendWebhook } from '../utils/resend'

// Resend inbound webhook: a business owner forwards a customer email to
// <token>@<inviteInboxDomain>. We pull out the customer's address and send them
// a review invite. Runs server-side with the service role (no user session).

interface ReceivedPayload {
  type?: string
  data?: {
    email_id?: string
    from?: string
    to?: string[]
    received_for?: string[]
    subject?: string
  }
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const inboxDomain = cfg.public.inviteInboxDomain
  const rootDomain = inboxDomain.split('.').slice(-2).join('.') // reviewupgrade.nl
  const supaUrl = process.env.SUPABASE_URL
  const serviceKey = cfg.supabaseServiceKey

  if (!cfg.resendKey || !cfg.resendWebhookSecret || !supaUrl || !serviceKey) {
    throw createError({ statusCode: 503, statusMessage: 'Inbound invites zijn nog niet geconfigureerd.' })
  }

  // Verify the Svix signature over the raw body before trusting anything.
  const raw = (await readRawBody(event)) || ''
  const ok = await verifyResendWebhook(cfg.resendWebhookSecret, {
    id: getHeader(event, 'svix-id'),
    timestamp: getHeader(event, 'svix-timestamp'),
    signature: getHeader(event, 'svix-signature'),
  }, raw)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Ongeldige webhook-handtekening' })

  const payload = JSON.parse(raw) as ReceivedPayload
  if (payload.type !== 'email.received' || !payload.data?.email_id) return { ignored: true }
  const d = payload.data

  // Which business? The inbox token is the local part of our inbox address.
  const recipients = [...(d.to ?? []), ...(d.received_for ?? [])]
  const inboxAddr = recipients.find(r => r.toLowerCase().includes(`@${inboxDomain.toLowerCase()}`))
  const token = inboxAddr?.split('@')[0]?.toLowerCase().trim()
  if (!token) return { ignored: 'no-inbox-address' }

  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  const rows = await $fetch<{ id: string, company_name: string | null, slug: string, email: string | null, bg_color: string | null, text_color: string | null, invite_texts: InviteTexts | null }[]>(
    `${supaUrl}/rest/v1/customers?invite_inbox=eq.${encodeURIComponent(token)}&select=id,company_name,slug,email,bg_color,text_color,invite_texts`,
    { headers: svc },
  )
  const customer = rows?.[0]
  if (!customer) return { ignored: 'unknown-inbox' }

  // Only accept forwards from the business owner's own address (anti-abuse).
  const senderAddr = (d.from ?? '').toLowerCase().match(/[^<>\s]+@[^<>\s]+/)?.[0] ?? ''
  const ownerEmail = (customer.email ?? '').toLowerCase().trim()
  if (!ownerEmail || senderAddr !== ownerEmail) return { ignored: 'sender-not-owner' }

  // Fetch the full message so we can read the forwarded body, then extract the
  // customer's address.
  const full = await resendGetReceived({ resendKey: cfg.resendKey }, d.email_id)
  const customerEmail = extractInviteEmail({
    subject: full.subject ?? d.subject,
    text: full.text,
    replyTo: full.reply_to,
    from: senderAddr,
    blockDomains: [rootDomain, inboxDomain],
  })

  const origin = getRequestURL(event).origin
  const company = customer.company_name || 'ons'
  const reviewBase = `${origin}/r/${customer.slug}`

  // Nothing usable → tell the owner how to fix it, don't invite anyone.
  if (!customerEmail) {
    await resendSend(cfg, {
      to: ownerEmail,
      subject: `Geen e-mailadres gevonden — ${company}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;max-width:480px">
        <p>We konden in de doorgestuurde e-mail geen e-mailadres van je klant vinden, dus er is <strong>geen uitnodiging</strong> verstuurd.</p>
        <p style="color:#555">Tip: zet het e-mailadres van je klant in de <strong>onderwerpregel</strong> en stuur nogmaals door naar <code>${token}@${inboxDomain}</code>.</p>
      </div>`,
    }).catch(() => {})
    return { invited: false, reason: 'no-address' }
  }

  // Log the invite (service role — no user session here), then send.
  let inviteId: string | null = null
  try {
    const created = await $fetch<{ id: string }[]>(`${supaUrl}/rest/v1/invites`, {
      method: 'POST',
      headers: { ...svc, Prefer: 'return=representation', 'Content-Type': 'application/json' },
      body: { customer_id: customer.id, email: customerEmail, source: 'inbound' },
    })
    inviteId = created?.[0]?.id ?? null
  }
  catch { /* untracked send */ }

  const { subject, html } = renderInviteEmail({
    company,
    reviewUrl: inviteId ? `${reviewBase}?i=${inviteId}` : reviewBase,
    texts: customer.invite_texts,
    pixelUrl: inviteId ? `${origin}/t/${inviteId}` : undefined,
    bgColor: customer.bg_color,
    textColor: customer.text_color,
  })

  let sentOk = false
  try {
    await resendSend(cfg, { to: customerEmail, subject, html })
    sentOk = true
  }
  catch { /* falls through to failed status */ }

  if (inviteId) {
    await $fetch(`${supaUrl}/rest/v1/invites?id=eq.${inviteId}`, {
      method: 'PATCH',
      headers: { ...svc, 'Content-Type': 'application/json' },
      body: { status: sentOk ? 'sent' : 'failed', sent_at: new Date().toISOString() },
    }).catch(() => {})
  }

  // Confirm to the owner what happened.
  await resendSend(cfg, {
    to: ownerEmail,
    subject: sentOk ? `Uitnodiging verstuurd naar ${customerEmail}` : `Uitnodiging mislukt — ${customerEmail}`,
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;max-width:480px">
      <p>${sentOk
        ? `We hebben <strong>${customerEmail}</strong> een review-uitnodiging voor ${company} gestuurd.`
        : `Het versturen naar <strong>${customerEmail}</strong> is helaas mislukt. Probeer het later opnieuw.`}</p>
    </div>`,
  }).catch(() => {})

  return { invited: sentOk, email: customerEmail }
})
