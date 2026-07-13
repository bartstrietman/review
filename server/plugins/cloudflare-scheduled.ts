import { logAllGoogleScores } from '../utils/logAllGoogleScores'

// Cloudflare Cron Trigger entry point. The cloudflare_module Nitro preset
// (nitropack 2.13.4) fires this hook from the Worker's scheduled() handler and
// already wraps the call in ctx.waitUntil, so awaiting here keeps the Worker
// alive until the scores are logged. Schedule lives in wrangler.jsonc
// ("triggers.crons"). Fallback if this hook is ever unavailable: pg_cron +
// pg_net POST to /api/cron/google-scores with x-cron-secret (see DEPLOY.md).
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ env }) => {
    const cfg = useRuntimeConfig()
    const supaUrl = (env as Record<string, string | undefined>)?.SUPABASE_URL || process.env.SUPABASE_URL || ''
    if (!supaUrl || !cfg.supabaseServiceKey || !cfg.serperKey) return
    await logAllGoogleScores({ supaUrl, serviceKey: cfg.supabaseServiceKey, serperKey: cfg.serperKey })
  })
})
