export function useSite() {
  const config = useRuntimeConfig()
  const siteName = computed(() => String(config.public.siteName || 'ReviewUpgrade'))
  const supportEmail = computed(() => `support@reviewupgrade.nl`)
  return { siteName, supportEmail }
}
