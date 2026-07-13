// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  // Cloudflare Workers (Nitro module preset)
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  runtimeConfig: {
    // server-only — set as Wrangler secret in prod
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    serperKey: process.env.SERPER_KEY || '',
    // shared secret for the Google-score cron trigger (x-cron-secret header)
    cronSecret: process.env.CRON_SECRET || '',
    resendKey: process.env.RESEND_API_KEY || '',
    resendFrom: process.env.RESEND_FROM || 'ReviewUpgrade <onboarding@resend.dev>',
    // Svix signing secret for the Resend inbound webhook (whsec_...).
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
    // dev-only admin login bypass (never enabled in prod)
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED || '',
    devAdminEmail: process.env.DEV_ADMIN_EMAIL || '',
    public: {
      siteName: 'ReviewUpgrade',
      // Exposed so the client can show the dev-login UI only in dev.
      devLogin: process.env.DEV_LOGIN_ENABLED === 'true',
      // Domain for the per-business inbound invite address <token>@<domain>.
      inviteInboxDomain: process.env.INVITE_INBOX_DOMAIN || 'invite.reviewupgrade.nl',
    },
  },

  supabase: {
    // OTP-only: we redirect manually, disable forced global redirect
    redirect: false,
  },

  i18n: {
    // Clean URLs everywhere (/dashboard, not /en/dashboard). Language is chosen
    // via the toggle and remembered in a cookie (+ per-account, see plugin).
    strategy: 'no_prefix',
    defaultLocale: 'nl',
    locales: [
      { code: 'nl', language: 'nl-NL', name: 'Nederlands', file: 'nl.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'rs_locale',
      alwaysRedirect: false,
    },
    bundle: { optimizeTranslationDirective: false },
    // hero.h1 contains intentional HTML (underline span + svg); allow it and
    // don't HTML-escape, since we render it with v-html.
    compilation: { strictMessage: false, escapeHtml: false },
  },

  fonts: {
    families: [
      { name: 'Space Grotesk', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
    ],
  },

  ui: {
    colorMode: false,
  },

  devtools: { enabled: true },
})
