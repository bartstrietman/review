<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()

const email = ref('')
const code = ref('')
const phase = ref<'email' | 'code'>('email')
const loading = ref(false)

const redirectTo = computed(() => (route.query.redirect as string) || localePath('/admin'))

watchEffect(() => {
  if (user.value) router.replace(redirectTo.value)
})

async function send() {
  if (!email.value.includes('@')) { toast.add({ title: t('otp.invalidEmail'), color: 'error' }); return }
  loading.value = true
  const { error } = await supabase.auth.signInWithOtp({ email: email.value, options: { shouldCreateUser: false } })
  loading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  phase.value = 'code'
  toast.add({ title: `${t('otp.sent')} ${email.value}`, color: 'success' })
}

async function verify() {
  loading.value = true
  const { error } = await supabase.auth.verifyOtp({ email: email.value, token: code.value.trim(), type: 'email' })
  loading.value = false
  if (error) { toast.add({ title: t('otp.invalidCode'), color: 'error' }); return }
}

async function devLogin(which: 'admin' | 'klant') {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: `${which}@reviewshield.test`,
    password: 'devpass1234',
  })
  loading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }) }
}

useSeoMeta({ title: 'Login — ReviewShield' })
</script>

<template>
  <UContainer class="py-16 sm:py-24 max-w-md">
    <div class="rounded-2xl border border-default bg-white p-8">
      <div class="flex items-center gap-2.5 font-display text-lg font-bold mb-6">
        <Logo :size="28" /> ReviewShield
      </div>
      <h1 class="text-2xl font-bold">Login</h1>
      <p class="text-sm text-muted mt-1 mb-6">{{ t('otp.sub') }}</p>

      <div v-if="phase === 'email'" class="space-y-4">
        <UFormField :label="t('otp.email')">
          <UInput v-model="email" type="email" class="w-full" placeholder="naam@bedrijf.nl" @keydown.enter="send" />
        </UFormField>
        <UButton color="primary" block size="lg" :loading="loading" @click="send">{{ t('otp.send') }}</UButton>
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-muted">{{ t('otp.sent') }} <strong>{{ email }}</strong></p>
        <UFormField :label="t('otp.code')" :help="t('otp.codeHint')">
          <UInput v-model="code" class="w-full tracking-widest" placeholder="000000" maxlength="6" @keydown.enter="verify" />
        </UFormField>
        <UButton color="primary" block size="lg" :loading="loading" @click="verify">{{ t('otp.verify') }}</UButton>
        <div class="flex justify-between">
          <UButton variant="link" color="neutral" size="xs" @click="phase = 'email'">{{ t('otp.back') }}</UButton>
          <UButton variant="link" color="neutral" size="xs" :loading="loading" @click="send">{{ t('otp.resend') }}</UButton>
        </div>
      </div>

      <template v-if="config.public.devLogin">
        <USeparator class="my-6" label="DEV" />
        <div class="grid grid-cols-2 gap-3">
          <UButton color="neutral" variant="soft" icon="i-lucide-shield" :loading="loading" @click="devLogin('admin')">Admin</UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-user" :loading="loading" @click="devLogin('klant')">Klant</UButton>
        </div>
      </template>
    </div>
  </UContainer>
</template>
