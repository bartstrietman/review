export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const localePath = useLocalePath()
  if (!user.value) {
    return navigateTo(localePath(`/login?redirect=${encodeURIComponent(to.fullPath)}`))
  }
})
