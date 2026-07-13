import { logAllGoogleScores } from '../../utils/logAllGoogleScores'

// Manual/external trigger for the daily Google-score cron. Guarded by a shared
// secret (x-cron-secret) so anyone-but-the-scheduler can't run it. This is the
// primary, locally-testable route; Cloudflare's own Cron Trigger fires the same
// work via server/plugins/cloudflare-scheduled.ts. pg_cron + pg_net can POST
// here as a fallback if the CF trigger is ever unavailable (see DEPLOY.md).
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const secret = cfg.cronSecret
  if (!secret || getHeader(event, 'x-cron-secret') !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Ongeldige cron-secret' })
  }

  const supaUrl = process.env.SUPABASE_URL
  if (!supaUrl || !cfg.supabaseServiceKey || !cfg.serperKey) {
    throw createError({ statusCode: 503, statusMessage: 'Cron nog niet geconfigureerd' })
  }

  return await logAllGoogleScores({ supaUrl, serviceKey: cfg.supabaseServiceKey, serperKey: cfg.serperKey })
})
