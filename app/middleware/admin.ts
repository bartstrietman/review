export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const localePath = useLocalePath()

  if (!user.value) {
    return navigateTo(localePath(`/login?redirect=${encodeURIComponent(to.fullPath)}`))
  }

  const role = (user.value.app_metadata as { role?: string } | undefined)?.role
  if (role !== 'admin') {
    // Authenticated but not an admin → send home.
    return navigateTo(localePath('/'))
  }
})
