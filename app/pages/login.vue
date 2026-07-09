<script setup lang="ts">
import type { User } from '@supabase/supabase-js'

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const { siteName } = useSite()
const toast = useToast()

const email = ref('')
const loading = ref(false)
const sent = ref(false)

function isAdmin(u: User | null) {
  return (u?.app_metadata as { role?: string } | undefined)?.role === 'admin'
}

async function navigateByRole(u: User | null) {
  const admin = isAdmin(u)
  // Wait for the reactive session to propagate so route middleware sees the
  // user — otherwise navigating to /admin bounces straight back to /login.
  if (!user.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(user, (v) => { if (v) { stop(); resolve() } })
      setTimeout(() => { stop(); resolve() }, 2500)
    })
  }
  await router.replace(admin ? ((route.query.redirect as string) || localePath('/admin')) : localePath('/dashboard'))
}

// Already-logged-in admin lands straight on the dashboard.
onMounted(() => {
  if (isAdmin(user.value)) navigateByRole(user.value)
})

// OTP / magic link (no passwords). Returns via /welkom which forwards by role.
async function sendLink() {
  if (!email.value.includes('@')) { toast.add({ title: t('otp.invalidEmail'), color: 'error' }); return }
  loading.value = true
  const redirect = `${window.location.origin}${localePath('/welkom')}`
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: { shouldCreateUser: false, emailRedirectTo: redirect },
  })
  loading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  sent.value = true
}

// Dev-only bypass (seeded accounts) — only rendered when DEV_LOGIN_ENABLED.
async function devLogin(which: 'admin' | 'klant') {
  loading.value = true
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${which}@reviewupgrade.test`,
    password: 'devpass1234',
  })
  loading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  navigateByRole(data.user)
}

usePageTitle('Inloggen')
</script>

<template>
  <UContainer class="py-16 sm:py-24 max-w-md">
    <div class="rounded-2xl border border-default bg-white p-8">
      <div class="flex items-center gap-2.5 font-display text-lg font-bold mb-6">
        <Logo :size="28" /> {{ siteName }}
      </div>
      <h1 class="text-2xl font-bold">Inloggen</h1>
      <p class="text-sm text-muted mt-1 mb-6">Geen wachtwoord nodig — we sturen je een inloglink per e-mail.</p>

      <div v-if="!sent" class="space-y-4">
        <UFormField label="E-mailadres">
          <UInput v-model="email" type="email" class="w-full" placeholder="naam@bedrijf.nl" @keydown.enter="sendLink" />
        </UFormField>
        <UButton color="primary" block size="lg" :loading="loading" @click="sendLink">Stuur inloglink</UButton>
      </div>

      <div v-else class="rounded-xl border border-default bg-elevated p-6 text-center">
        <div class="size-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <UIcon name="i-lucide-mail-check" class="size-6 text-green-700" />
        </div>
        <p class="font-semibold">{{ t('otp.linkSentTitle') }}</p>
        <p class="text-sm text-muted mt-1.5">{{ t('otp.linkSentBody') }} <strong>{{ email }}</strong>.</p>
        <UButton variant="link" color="neutral" size="xs" class="mt-3" :loading="loading" @click="sendLink">
          {{ t('otp.resend') }}
        </UButton>
      </div>

      <template v-if="config.public.devLogin">
        <USeparator class="my-6" label="DEV" />
        <div class="grid grid-cols-2 gap-3">
          <UButton color="neutral" variant="soft" icon="i-lucide-shield" :loading="loading" @click="devLogin('admin')">Admin</UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-user" :loading="loading" @click="devLogin('klant')">Klant</UButton>
        </div>
        <p class="text-xs text-muted mt-2 text-center">Alleen voor test — verdwijnt in productie.</p>
      </template>
    </div>
  </UContainer>
</template>
