<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()

// UI language: setLocale is enough — the locale-persist plugin stores it in
// user_metadata and restores it on login.
const localeItems = computed(() => locales.value.map(l => ({ label: l.name ?? l.code, value: l.code })))
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { customer, refresh } = useMyBusiness()

// Business details + review routing. Appearance/texts live on the Widget page.
const form = reactive({
  company_name: '', street: '', postcode: '', city: '', phone: '', website: '',
  google_url: '', review_platform: 'google',
})
const logoUrl = ref<string | null>(null)
watchEffect(() => {
  const c = customer.value
  if (!c) return
  Object.assign(form, {
    company_name: c.company_name ?? '', street: c.street ?? '', postcode: c.postcode ?? '', city: c.city ?? '',
    phone: c.phone ?? '', website: c.website ?? '', google_url: c.google_url ?? '',
    review_platform: c.review_platform ?? 'google',
  })
  logoUrl.value = c.logo_url
})

// Google Place linking: reuse the signup search to (re)link the business profile.
const linkingPlace = ref(false)
async function onPlaceSelect(p: import('~/components/Signup/BusinessSearch.vue').PlaceResult) {
  if (!customer.value || !p.placeId) return
  const { error } = await supabase.from('customers').update({
    google_place_id: p.placeId,
    google_url: p.reviewUrl || customer.value.google_url,
  }).eq('id', customer.value.id)
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  linkingPlace.value = false
  toast.add({ title: t('dash.set.placeLinked'), color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

const saving = ref(false)
async function save() {
  if (!customer.value) return
  saving.value = true
  const { error } = await supabase.from('customers').update({
    company_name: form.company_name, street: form.street, postcode: form.postcode, city: form.city,
    phone: form.phone, website: form.website, google_url: form.google_url,
    review_platform: form.review_platform,
  }).eq('id', customer.value.id)
  saving.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.set.saved'), color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

usePageTitle('Instellingen')
</script>

<template>
  <UDashboardPanel id="dash-settings">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.settings')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton color="primary" icon="i-lucide-save" :loading="saving" @click="save">{{ t('dash.set.save') }}</UButton>
          <UserMenu />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="customer" class="space-y-6 max-w-3xl">
        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.set.biz') }}</h2></template>
          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField :label="t('dash.set.name')"><UInput v-model="form.company_name" class="w-full" /></UFormField>
            <UFormField :label="t('dash.set.phone')"><UInput v-model="form.phone" class="w-full" /></UFormField>
            <UFormField :label="t('dash.set.street')"><UInput v-model="form.street" class="w-full" /></UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="t('dash.set.postcode')"><UInput v-model="form.postcode" class="w-full" /></UFormField>
              <UFormField :label="t('dash.set.city')"><UInput v-model="form.city" class="w-full" /></UFormField>
            </div>
            <UFormField :label="t('dash.set.website')" class="sm:col-span-2"><UInput v-model="form.website" class="w-full" /></UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.set.logo') }}</h2></template>
          <LogoUploader
            :customer-id="customer.id" v-model="logoUrl"
            :label="t('dash.set.logoUpload')" :help="t('dash.set.logoHelp')"
          />
        </UCard>

        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.set.routing') }}</h2></template>
          <p class="text-sm text-muted mb-4">{{ t('dash.set.routingD') }}</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField :label="t('dash.set.platform')">
              <USelect v-model="form.review_platform" :items="['google', 'trustpilot', 'tripadvisor', 'facebook', 'overig']" class="w-full" />
            </UFormField>

            <UFormField
              v-if="form.review_platform === 'google' && customer.google_place_id && !linkingPlace"
              :label="t('dash.set.placeId')"
              :help="t('dash.set.placeIdHelp')"
            >
              <div class="flex gap-2">
                <UInput :model-value="customer.google_place_id" readonly class="flex-1 font-mono text-xs" :aria-label="t('dash.set.placeId')" />
                <UButton color="neutral" variant="soft" @click="linkingPlace = true">{{ t('dash.set.placeChange') }}</UButton>
              </div>
            </UFormField>

            <UFormField v-else :label="t('dash.set.url')" :help="t('dash.set.urlHelp')">
              <UInput v-model="form.google_url" class="w-full" placeholder="https://…" />
            </UFormField>

            <div v-if="form.review_platform === 'google' && (!customer.google_place_id || linkingPlace)" class="sm:col-span-2">
              <UFormField :label="t('dash.set.placeSearch')" :help="t('dash.set.placeSearchHelp')">
                <SignupBusinessSearch @select="onPlaceSelect" />
              </UFormField>
              <UButton
                v-if="linkingPlace"
                variant="link" color="neutral" size="xs" class="!px-0"
                @click="linkingPlace = false"
              >
                {{ t('dash.set.placeCancel') }}
              </UButton>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.set.language') }}</h2></template>
          <UFormField :label="t('dash.set.languageLabel')" :help="t('dash.set.languageHelp')">
            <USelect
              :model-value="locale" :items="localeItems" class="w-full sm:w-64"
              @update:model-value="setLocale($event as 'nl' | 'en')"
            />
          </UFormField>
        </UCard>

        <UAlert
          color="neutral" variant="soft" icon="i-lucide-paintbrush"
          :title="t('dash.widget.nav')"
          :description="t('dash.widget.intro')"
          :actions="[{ label: t('dash.widget.nav'), to: localePath('/dashboard/widget'), color: 'neutral', variant: 'solid' }]"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
