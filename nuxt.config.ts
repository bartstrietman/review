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
    // dev-only admin login bypass (never enabled in prod)
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED || '',
    devAdminEmail: process.env.DEV_ADMIN_EMAIL || '',
    public: {
      siteName: 'ReviewShield',
      // Exposed so the client can show the dev-login UI only in dev.
      devLogin: process.env.DEV_LOGIN_ENABLED === 'true',
    },
  },

  supabase: {
    // OTP-only: we redirect manually, disable forced global redirect
    redirect: false,
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'nl',
    locales: [
      { code: 'nl', language: 'nl-NL', name: 'Nederlands', file: 'nl.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
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
