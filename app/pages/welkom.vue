<script setup lang="ts">
// Magic-link return target. Supabase establishes the session from the URL,
// then we save the customer using the signup data kept in localStorage.
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const supabase = useSupabaseClient()
const { data, clear } = useSignup()
const saveCustomer = useSaveCustomer()

const status = ref<'working' | 'error'>('working')
let done = false

async function complete(u: { id: string; app_metadata?: { role?: string } }) {
  if (done) return
  done = true

  // No pending signup data → this was just a login: route by role.
  if (!data.value.bedrijfsnaam) {
    const isAdmin = u.app_metadata?.role === 'admin'
    await router.replace(localePath(isAdmin ? '/admin' : '/dashboard'))
    return
  }
  try {
    const slug = await saveCustomer(data.value, u.id)
    clear()
    $fetch('/api/brand-import', { method: 'POST', body: { slug } }).catch(() => {})
    await router.replace(localePath(`/bevestiging/${slug}`))
  }
  catch {
    status.value = 'error'
  }
}

onMounted(async () => {
  // Wait for supabase-js to process the magic-link URL / restore the cookie
  // session before any RLS-protected write — otherwise it runs as anon (403).
  const { data: { session } } = await supabase.auth.getSession()
  if (session) { complete(session.user); return }

  const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
    if (s) { sub.subscription.unsubscribe(); complete(s.user) }
  })
  // Fallback if the session never arrives (e.g. link opened on another device).
  setTimeout(() => { if (!done) status.value = 'error' }, 9000)
})

usePageTitle()
</script>

<template>
  <UContainer class="py-24 max-w-md text-center">
    <div v-if="status === 'working'">
      <UIcon name="i-lucide-loader-circle" class="size-8 text-green-700 animate-spin mx-auto" />
      <p class="mt-4 text-muted">{{ t('voltooien.working') }}</p>
    </div>
    <div v-else>
      <div class="size-12 rounded-full bg-elevated flex items-center justify-center mx-auto mb-3">
        <UIcon name="i-lucide-triangle-alert" class="size-6 text-gold-600" />
      </div>
      <h1 class="text-xl font-semibold">{{ t('voltooien.failedTitle') }}</h1>
      <p class="mt-2 text-sm text-muted">{{ t('voltooien.failedBody') }}</p>
      <UButton :to="localePath('/aanmelden')" color="primary" class="mt-5">{{ t('voltooien.retry') }}</UButton>
    </div>
  </UContainer>
</template>
