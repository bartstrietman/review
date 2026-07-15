import { serverSupabaseUser } from '#supabase/server'

// Laatste 100 ReviewUpgrade-e-mails via Resend: verzonden (GET /emails) +
// ontvangen (GET /emails/receiving). Het Resend-account is gedeeld met andere
// producten (bv. HuisAssist), dus we filteren op het reviewupgrade.nl-domein
// en pagineren door tot we er 100 hebben (nieuwste eerst) of de cap raken.
type Row = {
  id: string
  direction: 'sent' | 'received'
  from: string
  to: string
  subject: string
  created_at: string
  status: string
}

const DOMAIN = 'reviewupgrade.nl'
const WANT = 100
const MAX_PAGES = 8 // scant max 800 per richting — nieuwste eerst, dus recente matches winnen

const mine = (r: Row) => `${r.from} ${r.to}`.toLowerCase().includes(DOMAIN)

export default defineEventHandler(async (event): Promise<Row[]> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
  if (user.app_metadata?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Alleen admin' })

  const { resendKey } = useRuntimeConfig()
  if (!resendKey) throw createError({ statusCode: 500, statusMessage: 'Resend API-key ontbreekt' })

  const headers = { Authorization: `Bearer ${resendKey}` }
  const map = (r: Record<string, unknown>, direction: 'sent' | 'received'): Row => ({
    id: String(r.id ?? ''),
    direction,
    from: String(r.from ?? ''),
    to: Array.isArray(r.to) ? r.to.join(', ') : String(r.to ?? ''),
    subject: String(r.subject ?? ''),
    created_at: String(r.created_at ?? ''),
    status: String(r.last_event ?? (direction === 'received' ? 'ontvangen' : '')),
  })

  const pull = async (path: string, direction: 'sent' | 'received'): Promise<Row[]> => {
    const out: Row[] = []
    let after: string | undefined
    for (let page = 0; page < MAX_PAGES && out.length < WANT; page++) {
      let res: { data?: Record<string, unknown>[] } | Record<string, unknown>[]
      try {
        res = await $fetch(`https://api.resend.com/${path}?limit=100${after ? `&after=${after}` : ''}`, { headers })
      }
      catch {
        break // endpoint kapot (bv. receiving niet aan) → geef terug wat we hebben
      }
      const list = Array.isArray(res) ? res : (res.data ?? [])
      if (!list.length) break
      for (const r of list) {
        const row = map(r, direction)
        if (mine(row)) out.push(row)
        if (out.length >= WANT) break
      }
      if (list.length < 100) break // laatste pagina
      after = String(list[list.length - 1]!.id)
    }
    return out
  }

  const [sent, received] = await Promise.all([
    pull('emails', 'sent'),
    pull('emails/receiving', 'received'),
  ])
  return [...sent, ...received]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, WANT)
})
