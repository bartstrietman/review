<script setup lang="ts">
import { COLOR_PALETTE } from '~/data/marketing'

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()

const { data, clear } = useSignup()
const saveCustomer = useSaveCustomer()
const step = ref(1)
const totalSteps = 4

// Preselect package from ?pkg=
onMounted(() => {
  const pkg = route.query.pkg
  if (pkg === 'lokaal' || pkg === 'pro') data.value.pakket = pkg
})

const stepLabels = computed(() => {
  // tm() returns compiled message AST nodes for array messages; rt() resolves them to strings.
  const s = tm('flow.steps') as unknown[]
  const label = (i: number, fallback: string) => (s?.[i] != null ? rt(s[i] as never) : fallback)
  return [label(0, 'Pakket'), label(1, 'Bedrijf'), label(2, 'Huisstijl'), t('otp.h')]
})

function next() { if (step.value < totalSteps) step.value++ }
function back() { if (step.value > 1) step.value-- }

// Autofill from a Google Maps (Serper) result — user can still edit everything.
const placeFilled = ref(false)
function onPlaceSelect(p: import('~/components/Signup/BusinessSearch.vue').PlaceResult) {
  const d = data.value
  d.bedrijfsnaam = p.title || d.bedrijfsnaam
  if (p.street) d.straatHuisnummer = p.street
  if (p.postcode) d.postcode = p.postcode
  if (p.city) d.plaats = p.city
  if (p.phone) d.telefoon = p.phone
  if (p.website) d.eigenSite = p.website
  if (p.reviewUrl) d.googleUrl = p.reviewUrl
  if (p.placeId) d.googlePlaceId = p.placeId
  placeFilled.value = true
}

// ── Auth state ──────────────────────────────────────────────
// Free-tier Supabase + default mail provider can only send a confirmation
// LINK (no 6-digit code). So we email a magic link; the signup data is kept
// in localStorage (see useSignup) and the customer row is saved on
// /aanmelden/voltooien after the user returns authenticated.
const linkPhase = ref<'email' | 'sent'>('email')
const otpLoading = ref(false)
const finishing = ref(false)

async function sendLink() {
  if (!data.value.email.includes('@')) { toast.add({ title: t('otp.invalidEmail'), color: 'error' }); return }
  otpLoading.value = true
  const redirectTo = `${window.location.origin}${localePath('/welkom')}`
  const { error } = await supabase.auth.signInWithOtp({
    email: data.value.email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  })
  otpLoading.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  linkPhase.value = 'sent'
}

// Dev-only: sign in as the seeded customer to skip real email.
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

// Same-tab finish (used after dev-login or when already authenticated).
async function finishSignup() {
  if (!user.value) return
  finishing.value = true
  try {
    const slug = await saveCustomer(data.value, user.value.id)
    clear()
    await router.push(localePath(`/bevestiging/${slug}`))
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

            <SignupBusinessSearch @select="onPlaceSelect" />
            <p v-if="placeFilled" class="-mt-3 mb-4 text-xs text-green-700 font-medium flex items-center gap-1.5">
              <UIcon name="i-lucide-check-circle" class="size-4" />{{ t('search.filled') }}
            </p>

            <div class="space-y-4">
              <UFormField :label="t('flow.biz.naam')">
                <UInput v-model="data.bedrijfsnaam" class="w-full" placeholder="Loodgietersbedrijf Van Dijk" />
              </UFormField>
              <UFormField :label="t('flow.biz.straat')">
                <UInput v-model="data.straatHuisnummer" class="w-full" placeholder="Hoofdstraat 12" />
              </UFormField>
              <div class="grid grid-cols-2 gap-4">
                <UFormField :label="t('flow.biz.postcode')">
                  <UInput v-model="data.postcode" class="w-full" placeholder="1234 AB" />
                </UFormField>
                <UFormField :label="t('flow.biz.plaats')">
                  <UInput v-model="data.plaats" class="w-full" placeholder="Amsterdam" />
                </UFormField>
              </div>
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

          <!-- STEP 4: email + magic link -->
          <div v-else-if="step === 4">
            <h3 class="text-xl font-semibold">{{ t('otp.h') }}</h3>
            <p class="text-sm text-muted mb-6">{{ t('otp.sub') }}</p>

            <!-- already authenticated (dev-login or returning user) -->
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
            <div v-else-if="linkPhase === 'email'">
              <UFormField :label="t('otp.email')" :help="t('flow.pay.email.hint')">
                <UInput v-model="data.email" type="email" class="w-full" placeholder="naam@bedrijf.nl" @keydown.enter="sendLink" />
              </UFormField>
              <UButton color="primary" block size="lg" class="mt-5" :loading="otpLoading" @click="sendLink">
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

            <!-- link sent -->
            <div v-else>
              <div class="rounded-xl border border-default bg-elevated p-6 text-center">
                <div class="size-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <UIcon name="i-lucide-mail-check" class="size-6 text-green-700" />
                </div>
                <p class="font-semibold">{{ t('otp.linkSentTitle') }}</p>
                <p class="text-sm text-muted mt-1.5">
                  {{ t('otp.linkSentBody') }} <strong>{{ data.email }}</strong>.
                </p>
                <p class="text-xs text-muted mt-3">{{ t('otp.linkSentHint') }}</p>
              </div>
              <div class="flex justify-between mt-3">
                <UButton variant="link" color="neutral" size="xs" @click="linkPhase = 'email'">{{ t('otp.back') }}</UButton>
                <UButton variant="link" color="neutral" size="xs" :loading="otpLoading" @click="sendLink">{{ t('otp.resend') }}</UButton>
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
