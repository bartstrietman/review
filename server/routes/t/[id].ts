// Invite open-tracking pixel: GET /t/<invite-uuid> marks the invite as opened
// and always returns a 1×1 transparent GIF — errors are swallowed so the image
// never breaks inside an email client.
const GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='), c => c.charCodeAt(0))
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'image/gif')
  setHeader(event, 'Cache-Control', 'no-store, private')

  const id = getRouterParam(event, 'id') || ''
  const supaUrl = process.env.SUPABASE_URL
  const supaKey = process.env.SUPABASE_KEY
  if (UUID_RE.test(id) && supaUrl && supaKey) {
    try {
      await $fetch(`${supaUrl}/rest/v1/rpc/mark_invite_opened`, {
        method: 'POST',
        headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
        body: { p_invite: id },
      })
    }
    catch { /* pixel must never fail */ }
  }

  return GIF
})
