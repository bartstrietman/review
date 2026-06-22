<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { customer, refresh } = useMyBusiness()

// Local editable copy.
const form = reactive({
  company_name: '', street: '', postcode: '', city: '', phone: '', website: '',
  google_url: '', review_platform: 'google', feedback_prompt: '', bg_color: '#0F3D2E', text_color: '#FFFFFF',
})
watchEffect(() => {
  const c = customer.value
  if (!c) return
  Object.assign(form, {
    company_name: c.company_name ?? '', street: c.street ?? '', postcode: c.postcode ?? '', city: c.city ?? '',
    phone: c.phone ?? '', website: c.website ?? '', google_url: c.google_url ?? '',
    review_platform: c.review_platform ?? 'google', feedback_prompt: c.feedback_prompt ?? '',
    bg_color: c.bg_color ?? '#0F3D2E', text_color: c.text_color ?? '#FFFFFF',
  })
})

const saving = ref(false)
async function save() {
  if (!customer.value) return
  saving.value = true
  const { error } = await supabase.from('customers').update({
    company_name: form.company_name, street: form.street, postcode: form.postcode, city: form.city,
    phone: form.phone, website: form.website, google_url: form.google_url,
    review_platform: form.review_platform, feedback_prompt: form.feedback_prompt,
    bg_color: form.bg_color, text_color: form.text_color,
  }).eq('id', customer.value.id)
  saving.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.set.saved'), color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

useSeoMeta({ title: 'Instellingen — ReviewShield' })
</script>

<template>
  <UDashboardPanel id="dash-settings">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.settings')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton color="primary" icon="i-lucide-save" :loading="saving" @click="save">{{ t('dash.set.save') }}</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="customer" class="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <div class="lg:col-span-2 space-y-6">
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
            <template #header><h2 class="font-semibold">{{ t('dash.set.routing') }}</h2></template>
            <p class="text-sm text-muted mb-4">{{ t('dash.set.routingD') }}</p>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField :label="t('dash.set.platform')">
                <USelect v-model="form.review_platform" :items="['google', 'trustpilot', 'tripadvisor', 'facebook', 'overig']" class="w-full" />
              </UFormField>

              <!-- Google: link comes from the Place ID automatically -->
              <UFormField
                v-if="form.review_platform === 'google' && customer.google_place_id"
                :label="t('dash.set.placeId')"
                :help="t('dash.set.placeIdHelp')"
              >
                <UInput :model-value="customer.google_place_id" readonly class="w-full font-mono text-xs" :aria-label="t('dash.set.placeId')" />
              </UFormField>

              <!-- Other platforms (or no Place ID): enter the review URL manually -->
              <UFormField v-else :label="t('dash.set.url')" :help="t('dash.set.urlHelp')">
                <UInput v-model="form.google_url" class="w-full" placeholder="https://…" />
              </UFormField>

              <UFormField :label="t('dash.set.prompt')" class="sm:col-span-2" :help="t('dash.set.promptHelp')">
                <UInput v-model="form.feedback_prompt" class="w-full" placeholder="Wat kunnen we verbeteren?" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header><h2 class="font-semibold">{{ t('dash.set.style') }}</h2></template>
            <div class="space-y-4">
              <UFormField :label="t('dash.set.bg')">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: form.bg_color }" />
                  <UInput v-model="form.bg_color" class="w-32" />
                </div>
              </UFormField>
              <UFormField :label="t('dash.set.text')">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: form.text_color }" />
                  <UInput v-model="form.text_color" class="w-32" />
                </div>
              </UFormField>
              <div class="rounded-xl p-6 text-center font-semibold" :style="{ background: form.bg_color, color: form.text_color }">
                {{ t('dash.set.preview') }}
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
