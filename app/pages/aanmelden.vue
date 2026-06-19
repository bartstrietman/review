<script setup lang="ts">
import { COLOR_PALETTE, slugify } from '~/data/marketing'
import type { Database } from '~/types/database.types'

const { t, tm } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()

const data = useSignup()
const step = ref(1)
const totalSteps = 4

// Preselect package from ?pkg=
onMounted(() => {
  const pkg = route.query.pkg
  if (pkg === 'lokaal' || pkg === 'pro') data.value.pakket = pkg
})

const stepLabels = computed(() => {
  const s = tm('flow.steps') as unknown as string[]
  return [s?.[0] ?? 'Pakket', s?.[1] ?? 'Bedrijf', s?.[2] ?? 'Huisstijl', t('otp.h')]
})

function next() { if (step.value < totalSteps) step.value++ }
function back() { if (step.value > 1) step.value-- }

// ── OTP / auth state ────────────────────────────────────────
const otpPhase = ref<'email' | 'code'>('email')
const otpCode = ref('')
const otpLoading = ref(false)
const finishing = ref(false)

async function sendOtp() {
  if (!data.value.email.includes('@')) { toast.add({ title: t('otp.invalidEmail'), color: 'error' }); return }
  otpLoading.value = true
  const { error } = await supabase.auth.signInWithOtp({
    email: data.value.email,
    options: { shouldCreateUser: true },
  })
  otpLoading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  otpPhase.value = 'code'
  toast.add({ title: `${t('otp.sent')} ${data.value.email}`, color: 'success' })
}

async function verifyOtp() {
  otpLoading.value = true
  const { error } = await supabase.auth.verifyOtp({
    email: data.value.email,
    token: otpCode.value.trim(),
    type: 'email',
  })
  otpLoading.value = false
  if (error) { toast.add({ title: t('otp.invalidCode'), color: 'error' }); return }
  await finishSignup()
}

// Dev-only: sign in as the seeded customer to skip real OTP email.
async function devLogin() {
  otpLoading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: config.public.devLogin ? 'klant@reviewshield.test' : '',
    password: 'devpass1234',
  })
  otpLoading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  if (!data.value.email) data.value.email = 'klant@reviewshield.test'
  toast.add({ title: 'Dev login OK', color: 'success' })
}

async function finishSignup() {
  if (!user.value) return
  finishing.value = true
  try {
    const d = data.value
    const base = slugify(d.bedrijfsnaam)
    const payload = {
      user_id: user.value.id,
      company_name: d.bedrijfsnaam,
      street: d.straatHuisnummer || null,
      postcode_city: d.postcodePlaats || null,
      phone: d.telefoon || null,
      website: d.eigenSite || null,
      google_url: d.googleUrl || null,
      package: d.pakket,
      bg_color: d.achtergrondkleur,
      text_color: d.tekstkleur,
      email: d.email,
      status: 'trial' as const,
    }

    // Insert under the user's session (RLS: user_id = auth.uid()).
    // Retry with a short suffix if the clean slug is already taken.
    let savedSlug = ''
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
      const { data: row, error } = await supabase
        .from('customers')
        .insert({ ...payload, slug })
        .select('slug')
        .single()
      if (!error && row) { savedSlug = row.slug; break }
      if (error && error.code !== '23505') throw new Error(error.message)
    }
    if (!savedSlug) throw new Error('Kon geen unieke slug genereren')

    await router.push(localePath(`/bevestiging/${savedSlug}`))
  }
  catch (e: unknown) {
    toast.add({ title: (e as Error)?.message ?? 'Error', color: 'error' })
  }
  finally {
    finishing.value = false
  }
}

useSeoMeta({ title: () => `${t('signup.h2')} — ReviewShield` })
</script>

<template>
  <section class="bg-elevated py-12 sm:py-16 min-h-[80vh]">
    <UContainer>
      <div class="max-w-xl mx-auto mb-6">
        <UButton :to="localePath('/')" variant="link" color="neutral" icon="i-lucide-arrow-left" class="!px-0">
          {{ t('back') }}
        </UButton>
      </div>

      <div class="max-w-xl mx-auto overflow-hidden rounded-2xl border border-default bg-white">
        <!-- progress -->
        <div class="flex border-b border-default">
          <div
            v-for="(label, i) in stepLabels" :key="i"
            class="flex-1 flex items-center gap-1.5 px-3 py-3.5 text-xs font-semibold border-b-[3px]"
            :class="[
              step === i + 1 ? 'text-green-700 border-green-700'
              : step > i + 1 ? 'text-green-600 border-green-600' : 'text-muted border-default',
            ]"
          >
            <span
              class="size-5 rounded-full flex items-center justify-center text-[11px] shrink-0"
              :class="step === i + 1 ? 'bg-green-700 text-white' : step > i + 1 ? 'bg-green-600 text-white' : 'bg-elevated'"
            >
              <UIcon v-if="step > i + 1" name="i-lucide-check" class="size-3" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="hidden sm:inline">{{ label }}</span>
          </div>
        </div>

        <div class="p-7 sm:p-9">
          <!-- STEP 1: package -->
          <div v-if="step === 1">
            <h3 class="text-xl font-semibold">{{ t('flow.pkg.h') }}</h3>
            <p class="text-sm text-muted mb-6">{{ t('flow.pkg.sub') }}</p>
            <div class="grid grid-cols-2 gap-4">
              <button
                v-for="p in (['lokaal', 'pro'] as const)" :key="p"
                type="button"
                class="rounded-xl border-2 p-5 text-left transition-colors"
                :class="data.pakket === p ? 'border-green-700 bg-green-50' : 'border-default hover:border-green-300'"
                @click="data.pakket = p"
              >
                <h4 class="font-semibold">{{ t(`flow.pkg.${p}.name`) }}</h4>
                <div class="font-display text-lg font-bold mt-1">
                  {{ t(`flow.pkg.${p}.price`) }} <span class="text-xs font-medium text-muted">/ {{ t('pricing.permonth') }}</span>
                </div>
                <p class="text-[13px] text-muted mt-1.5">{{ t(`flow.pkg.${p}.desc`) }}</p>
              </button>
            </div>
            <div class="flex justify-end mt-7">
              <UButton color="primary" trailing-icon="i-lucide-arrow-right" @click="next">{{ t('flow.btn.next') }}</UButton>
            </div>
          </div>

          <!-- STEP 2: business -->
          <div v-else-if="step === 2">
            <h3 class="text-xl font-semibold">{{ t('flow.biz.h') }}</h3>
            <p class="text-sm text-muted mb-6">{{ t('flow.biz.sub') }}</p>
            <div class="space-y-4">
              <UFormField :label="t('flow.biz.naam')">
                <UInput v-model="data.bedrijfsnaam" class="w-full" placeholder="Loodgietersbedrijf Van Dijk" />
              </UFormField>
              <UFormField :label="t('flow.biz.straat')">
                <UInput v-model="data.straatHuisnummer" class="w-full" placeholder="Hoofdstraat 12" />
              </UFormField>
              <UFormField :label="t('flow.biz.postcode')">
                <UInput v-model="data.postcodePlaats" class="w-full" placeholder="1234 AB Amsterdam" />
              </UFormField>
              <UFormField :label="`${t('flow.biz.tel.label')} ${t('flow.biz.telopt')}`" :help="t('flow.biz.tel.hint')">
                <UInput v-model="data.telefoon" class="w-full" placeholder="06 12345678" />
              </UFormField>
              <UFormField :label="t('flow.biz.site.label')" :help="t('flow.biz.site.hint')">
                <UInput v-model="data.eigenSite" type="url" class="w-full" placeholder="https://jouwbedrijf.nl" />
              </UFormField>
              <UFormField :label="t('flow.biz.google.label')" :help="t('flow.biz.google.hint')">
                <UInput v-model="data.googleUrl" type="url" class="w-full" placeholder="https://g.page/r/.../review" />
              </UFormField>
            </div>
            <div class="flex justify-between mt-7">
              <UButton color="neutral" variant="ghost" @click="back">{{ t('flow.btn.back') }}</UButton>
              <UButton color="primary" trailing-icon="i-lucide-arrow-right" :disabled="!data.bedrijfsnaam" @click="next">{{ t('flow.btn.next') }}</UButton>
            </div>
          </div>

          <!-- STEP 3: style -->
          <div v-else-if="step === 3">
            <h3 class="text-xl font-semibold">{{ t('flow.style.h') }}</h3>
            <p class="text-sm text-muted mb-6">{{ t('flow.style.sub') }}</p>

            <SignupColorBlock v-model="data.achtergrondkleur" :label="t('flow.style.bg')" :palette="COLOR_PALETTE" />
            <SignupColorBlock v-model="data.tekstkleur" :label="t('flow.style.fg')" :palette="COLOR_PALETTE" />

            <UFormField :label="t('flow.style.preview.label')">
              <div
                class="rounded-xl p-6 text-center font-semibold"
                :style="{ background: data.achtergrondkleur, color: data.tekstkleur }"
              >
                {{ t('flow.style.preview.text') }}
              </div>
            </UFormField>

            <div class="flex justify-between mt-7">
              <UButton color="neutral" variant="ghost" @click="back">{{ t('flow.btn.back') }}</UButton>
              <UButton color="primary" trailing-icon="i-lucide-arrow-right" @click="next">{{ t('flow.btn.next') }}</UButton>
            </div>
          </div>

          <!-- STEP 4: email + OTP -->
          <div v-else-if="step === 4">
            <h3 class="text-xl font-semibold">{{ t('otp.h') }}</h3>
            <p class="text-sm text-muted mb-6">{{ t('otp.sub') }}</p>

            <!-- already authenticated -->
            <div v-if="user">
              <div class="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-800 mb-5">
                <UIcon name="i-lucide-check-circle" class="size-5 shrink-0" />
                {{ t('otp.loggedInAs') }} <strong>{{ user.email }}</strong>
              </div>
              <UButton color="primary" block size="lg" :loading="finishing" @click="finishSignup">
                {{ t('otp.finish') }}
              </UButton>
            </div>

            <!-- email entry -->
            <div v-else-if="otpPhase === 'email'">
              <UFormField :label="t('otp.email')" :help="t('flow.pay.email.hint')">
                <UInput v-model="data.email" type="email" class="w-full" placeholder="naam@bedrijf.nl" @keydown.enter="sendOtp" />
              </UFormField>
              <UButton color="primary" block size="lg" class="mt-5" :loading="otpLoading" @click="sendOtp">
                {{ t('otp.send') }}
              </UButton>
              <UButton
                v-if="config.public.devLogin"
                color="neutral" variant="soft" block class="mt-3" icon="i-lucide-flask-conical"
                :loading="otpLoading" @click="devLogin"
              >
                {{ t('otp.dev') }}
              </UButton>
            </div>

            <!-- code entry -->
            <div v-else>
              <p class="text-sm text-muted mb-3">{{ t('otp.sent') }} <strong>{{ data.email }}</strong></p>
              <UFormField :label="t('otp.code')" :help="t('otp.codeHint')">
                <UInput v-model="otpCode" class="w-full tracking-widest" placeholder="000000" maxlength="6" @keydown.enter="verifyOtp" />
              </UFormField>
              <UButton color="primary" block size="lg" class="mt-5" :loading="otpLoading || finishing" @click="verifyOtp">
                {{ t('otp.verify') }}
              </UButton>
              <div class="flex justify-between mt-3">
                <UButton variant="link" color="neutral" size="xs" @click="otpPhase = 'email'">{{ t('otp.back') }}</UButton>
                <UButton variant="link" color="neutral" size="xs" :loading="otpLoading" @click="sendOtp">{{ t('otp.resend') }}</UButton>
              </div>
            </div>

            <div class="flex justify-start mt-6">
              <UButton color="neutral" variant="ghost" @click="back">{{ t('flow.btn.back') }}</UButton>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
