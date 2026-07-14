import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

// Only the login email needs the service role: it lives in auth.users and the
// browser client can't touch another user's identity. Every other customer
// field is edited straight from the admin page under RLS (is_admin()).
const bodySchema = z.object({ email: z.string().email() })

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
  if (user.app_metadata?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Alleen admin' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Geen klant-id' })
  const { email } = await readValidatedBody(event, bodySchema.parse)

  const admin = serverSupabaseServiceRole<Database>(event)
  const { data: cust } = await admin.from('customers').select('user_id').eq('id', id).single()
  if (!cust?.user_id) throw createError({ statusCode: 404, statusMessage: 'Klant niet gevonden' })

  // email_confirm: admin sets it authoritatively, no re-confirmation mail.
  const { error: authErr } = await admin.auth.admin.updateUserById(cust.user_id, { email, email_confirm: true })
  if (authErr) throw createError({ statusCode: 409, statusMessage: authErr.message })

  await admin.from('customers').update({ email }).eq('id', id)
  return { email }
})
