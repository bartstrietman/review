import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { PRICING_PLAN, slugify } from '~/data/marketing'
import { renderAccountInviteEmail } from '~~/shared/utils/inviteEmail'
import { copyLogoToStorage } from '../../utils/logo'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const bodySchema = z.object({
  company_name: z.string().min(1).max(200),
  email: z.string().email(),
  street: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  google_url: z.string().optional(),
  google_place_id: z.string().optional(),
  bg_color: hexColor.default('#0F3D2E'),
  text_color: hexColor.default('#FFFFFF'),
  logo_url: z.string().url().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })

  // Service key pas aanraken nadat de aanroeper als admin is geverifieerd.
  if (user.app_metadata?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Alleen admin' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const cfg = useRuntimeConfig()
  const admin = serverSupabaseServiceRole<Database>(event)

  const origin = getRequestURL(event).origin
  const linkResult = await admin.auth.admin.generateLink({
    type: 'invite',
    email: body.email,
    options: { redirectTo: `${origin}/welkom` },
  })
  if (linkResult.error) {
    throw createError({ statusCode: 409, statusMessage: 'Er bestaat al een account met dit e-mailadres.' })
  }
  const userId = linkResult.data.user.id
  const actionLink = linkResult.data.properties.action_link

  const base = slugify(body.company_name)
  const trialUntil = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10)
  const payload = {
    user_id: userId,
    email: body.email,
    company_name: body.company_name,
    street: body.street || null,
    postcode: body.postcode || null,
    city: body.city || null,
    phone: body.phone || null,
    website: body.website || null,
    google_url: body.google_url || null,
    google_place_id: body.google_place_id || null,
    package: PRICING_PLAN.id,
    bg_color: body.bg_color,
    text_color: body.text_color,
    status: 'trial' as const,
    billing_status: 'trial',
    monthly_price_cents: PRICING_PLAN.priceCents,
    trial_until: trialUntil,
    logo_url: null,
  }

  let inserted: { id: string, slug: string } | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data: row, error } = await admin
      .from('customers')
      .insert({ ...payload, slug })
      .select('id, slug')
      .single()
    if (!error && row) { inserted = row; break }
    if (error && error.code !== '23505') break
  }
  if (!inserted) {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    throw createError({ statusCode: 500, statusMessage: 'Kon klant niet aanmaken' })
  }

  // Logo: best-effort, mag nooit het aanmaken van de klant blokkeren.
  if (body.logo_url) {
    try {
      const pub = await copyLogoToStorage(admin, inserted.id, body.logo_url)
      if (pub) await admin.from('customers').update({ logo_url: pub }).eq('id', inserted.id)
    }
    catch { /* logo is optioneel, klant kan later zelf uploaden */ }
  }

  let invited = false
  if (cfg.resendKey && actionLink) {
    try {
      const { subject, html } = renderAccountInviteEmail({ company: body.company_name, actionLink })
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
        body: { from: cfg.resendFrom, to: body.email, subject, html },
      })
      invited = true
    }
    catch { /* account blijft geldig, alleen de uitnodigingsmail faalde */ }
  }

  return { id: inserted.id, slug: inserted.slug, invited }
})
