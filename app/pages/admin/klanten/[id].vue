<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const id = route.params.id as string

const { data: c, refresh } = await useAsyncData(`admin-customer-${id}`, async () => {
  const { data } = await supabase.from('customers').select('*').eq('id', id).single()
  return data
})

const saving = ref(false)
async function save() {
  if (!c.value) return
  saving.value = true
  const { error } = await supabase.from('customers').update({
    company_name: c.value.company_name,
    street: c.value.street,
    postcode: c.value.postcode,
    city: c.value.city,
    phone: c.value.phone,
    website: c.value.website,
    google_url: c.value.google_url,
    bg_color: c.value.bg_color,
    text_color: c.value.text_color,
    feedback_prompt: c.value.feedback_prompt,
    review_platform: c.value.review_platform,
    package: c.value.package,
    status: c.value.status,
  }).eq('id', id)
  saving.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: 'Opgeslagen', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

const popupCode = computed(() =>
  c.value ? `<script src="https://reviewupgrade.nl/widget/${c.value.slug}.js" data-mode="popup"><\/script>` : '',
)
</script>

<template>
  <UDashboardPanel id="admin-klant-detail">
    <template #header>
      <UDashboardNavbar :title="c?.company_name || 'Klant'">
        <template #leading>
          <UButton to="/admin/klanten" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
        <template #right>
          <UButton :loading="saving" color="primary" icon="i-lucide-save" @click="save">Opslaan</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="c" class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header><h3 class="font-semibold">Bedrijfsgegevens</h3></template>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Bedrijfsnaam"><UInput v-model="c.company_name" class="w-full" /></UFormField>
              <UFormField label="E-mail"><UInput v-model="c.email" class="w-full" disabled /></UFormField>
              <UFormField label="Straat + huisnummer"><UInput v-model="c.street" class="w-full" /></UFormField>
              <UFormField label="Postcode"><UInput v-model="c.postcode" class="w-full" /></UFormField>
              <UFormField label="Plaats"><UInput v-model="c.city" class="w-full" /></UFormField>
              <UFormField label="Telefoon"><UInput v-model="c.phone" class="w-full" /></UFormField>
              <UFormField label="Website"><UInput v-model="c.website" class="w-full" /></UFormField>
              <UFormField label="Google review-URL" class="sm:col-span-2"><UInput v-model="c.google_url" class="w-full" /></UFormField>
              <UFormField v-if="c.google_place_id" label="Google Place ID" class="sm:col-span-2">
                <UInput :model-value="c.google_place_id" readonly class="w-full font-mono text-xs" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Abonnement</h3></template>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Pakket">
                <USelect v-model="c.package" :items="['lokaal', 'pro']" class="w-full" />
              </UFormField>
              <UFormField label="Status">
                <USelect v-model="c.status" :items="['trial', 'active', 'paused', 'cancelled']" class="w-full" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header><h3 class="font-semibold">Logo</h3></template>
            <LogoUploader v-if="c" :customer-id="c.id" v-model="c.logo_url" />
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Widget-config</h3></template>
            <div class="space-y-4">
              <UFormField label="Achtergrondkleur">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: c.bg_color }" />
                  <UInput v-model="c.bg_color" class="w-32" />
                </div>
              </UFormField>
              <UFormField label="Tekstkleur">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: c.text_color }" />
                  <UInput v-model="c.text_color" class="w-32" />
                </div>
              </UFormField>
              <div class="rounded-xl p-5 text-center font-semibold" :style="{ background: c.bg_color, color: c.text_color }">
                Hoe was uw ervaring?
              </div>
              <UFormField label="Reviewplatform" help="Waar 4–5 sterren naartoe gaan.">
                <USelect
                  v-model="c.review_platform"
                  :items="['google', 'trustpilot', 'tripadvisor', 'facebook', 'overig']"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Feedback-prompt (1–3 sterren)" help="De vraag die ontevreden klanten zien.">
                <UInput v-model="c.feedback_prompt" class="w-full" placeholder="Wat kunnen we verbeteren?" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Reviewpagina</h3></template>
            <a :href="`/r/${c.slug}`" target="_blank" class="text-sm text-green-700 font-medium hover:underline flex items-center gap-1.5">
              <UIcon name="i-lucide-external-link" class="size-4" />/r/{{ c.slug }}
            </a>
            <p class="text-xs text-muted mt-3 mb-1.5">Embed-snippet:</p>
            <pre class="overflow-x-auto rounded-lg bg-green-900 text-green-50 text-[11px] p-3"><code>{{ popupCode }}</code></pre>
          </UCard>
        </div>
      </div>
      <p v-else class="text-center text-muted py-10">Klant niet gevonden.</p>
    </template>
  </UDashboardPanel>
</template>
