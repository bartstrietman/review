import { serverSupabaseUser } from '#supabase/server'

// Laatste 100 e-mails via Resend: verzonden (GET /emails) + ontvangen
// (GET /emails/receiving), gecombineerd en op datum gesorteerd.
type Row = {
  id: string
  direction: 'sent' | 'received'
  from: string
  to: string
  subject: string
  created_at: string
  status: string
}

export default defineEventHandler(async (event): Promise<Row[]> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
  if (user.app_metadata?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Alleen admin' })

  const { resendKey } = useRuntimeConfig()
  if (!resendKey) throw createError({ statusCode: 500, statusMessage: 'Resend API-key ontbreekt' })

  const headers = { Authorization: `Bearer ${resendKey}` }
  const pull = async (path: string, direction: 'sent' | 'received'): Promise<Row[]> => {
    try {
      // Resend list endpoints return { data: [...] } (of soms een kale array).
      const res = await $fetch<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
        `https://api.resend.com/${path}?limit=100`,
        { headers },
      )
      const list = Array.isArray(res) ? res : (res.data ?? [])
      return list.map((r): Row => ({
        id: String(r.id ?? ''),
        direction,
        from: String(r.from ?? ''),
        to: Array.isArray(r.to) ? r.to.join(', ') : String(r.to ?? ''),
        subject: String(r.subject ?? ''),
        created_at: String(r.created_at ?? ''),
        status: String(r.last_event ?? (direction === 'received' ? 'ontvangen' : '')),
      }))
    }
    catch {
      // Eén endpoint kapot (bv. receiving niet aan) mag de andere niet blokkeren.
      return []
    }
  }

  const [sent, received] = await Promise.all([
    pull('emails', 'sent'),
    pull('emails/receiving', 'received'),
  ])
  return [...sent, ...received]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 100)
})
