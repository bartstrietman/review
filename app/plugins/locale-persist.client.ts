// Remembers a customer's language choice on their account (cross-device).
// Anonymous visitors are already covered by the i18n cookie.
// NOTE: useI18n() can't be called at plugin top-level — use the global $i18n.
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as {
    locale: { value: string }
    setLocale: (l: 'nl' | 'en') => void | Promise<void>
  }
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // Apply the saved preference when a user logs in / on load — but only when
  // this device has no explicit choice yet (rs_locale cookie). The cookie wins:
  // user_metadata comes from JWT claims, which can lag behind updateUser and
  // would otherwise fight a fresh language switch on every page load.
  watch(user, (u) => {
    const saved = (u?.user_metadata as { locale?: string } | undefined)?.locale
    const explicit = useCookie('rs_locale').value
    if (!explicit && (saved === 'nl' || saved === 'en') && saved !== i18n.locale.value) {
      i18n.setLocale(saved)
    }
  }, { immediate: true })

  // Persist locale changes for logged-in users.
  watch(() => i18n.locale.value, (l) => {
    const u = user.value
    if (u && (u.user_metadata as { locale?: string } | undefined)?.locale !== l) {
      supabase.auth.updateUser({ data: { locale: l } })
    }
  })
})
