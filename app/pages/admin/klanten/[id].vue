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

const origEmail = ref(c.value?.email ?? '')

// Edit against a plain reactive form. USelect's v-model doesn't reliably write
// back through the useAsyncData data proxy (a picked option was silently
// dropped on save), so we mirror the DB-editable fields here and save from this.
const FIELDS = ['company_name', 'street', 'postcode', 'city', 'phone', 'website',
  'google_url', 'bg_color', 'text_color', 'feedback_prompt', 'review_platform',
  'package', 'status'] as const
type Field = typeof FIELDS[number]
const form = reactive(Object.fromEntries(FIELDS.map(k => [k, ''])) as Record<Field, string>)
// Re-init only when the loaded customer changes (not on every c mutation, e.g.
// a logo upload) so it doesn't wipe unsaved edits.
watch(() => c.value?.id, () => {
  if (c.value) for (const k of FIELDS) form[k] = (c.value[k] as string | null) ?? ''
}, { immediate: true })

const saving = ref(false)
async function save() {
  if (!c.value) return
  saving.value = true
  try {
    // Email is the login identity → goes through the admin server route
    // (updates auth.users + customers). Only call it when it actually changed.
    const newEmail = (c.value.email ?? '').trim()
    if (newEmail && newEmail !== (origEmail.value ?? '')) {
      await $fetch(`/api/admin/customers/${id}`, { method: 'PATCH', body: { email: newEmail } })
      origEmail.value = newEmail
    }

    const { error } = await supabase.from('customers').update({ ...form }).eq('id', id)
    if (error) throw new Error(error.message)

    toast.add({ title: 'Opgeslagen', color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  catch (e: unknown) {
    toast.add({ title: (e as { statusMessage?: string, message?: string })?.statusMessage ?? (e as Error)?.message ?? 'Opslaan mislukt', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

const origin = useRequestURL().origin
const popupCode = computed(() =>
  c.value ? `<script src="${origin}/widget/${c.value.slug}.js" data-mode="popup"><\/script>` : '',
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
              <UFormField label="Bedrijfsnaam"><UInput v-model="form.company_name" class="w-full" /></UFormField>
              <UFormField label="E-mail" help="Dit is ook het inlogadres van de klant.">
                <UInput v-model="c.email" type="email" class="w-full" />
              </UFormField>
              <UFormField label="Straat + huisnummer"><UInput v-model="form.street" class="w-full" /></UFormField>
              <UFormField label="Postcode"><UInput v-model="form.postcode" class="w-full" /></UFormField>
              <UFormField label="Plaats"><UInput v-model="form.city" class="w-full" /></UFormField>
              <UFormField label="Telefoon"><UInput v-model="form.phone" class="w-full" /></UFormField>
              <UFormField label="Website"><UInput v-model="form.website" class="w-full" /></UFormField>
              <UFormField label="Google review-URL" class="sm:col-span-2"><UInput v-model="form.google_url" class="w-full" /></UFormField>
              <UFormField v-if="c.google_place_id" label="Google Place ID" class="sm:col-span-2">
                <UInput :model-value="c.google_place_id" readonly class="w-full font-mono text-xs" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Abonnement</h3></template>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Pakket">
                <USelect v-model="form.package" :items="['lokaal', 'pro']" class="w-full" />
              </UFormField>
              <UFormField label="Status">
                <USelect v-model="form.status" :items="['trial', 'active', 'paused', 'cancelled']" class="w-full" />
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
              <ColorField v-model="form.bg_color" label="Achtergrondkleur" />
              <ColorField v-model="form.text_color" label="Tekstkleur" />
              <div class="rounded-xl p-5 text-center font-semibold" :style="{ background: form.bg_color, color: form.text_color }">
                Hoe was uw ervaring?
              </div>
              <UFormField label="Reviewplatform" help="Waar 4–5 sterren naartoe gaan.">
                <USelect
                  v-model="form.review_platform"
                  :items="['google', 'trustpilot', 'tripadvisor', 'facebook', 'overig']"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Feedback-prompt (1–3 sterren)" help="De vraag die ontevreden klanten zien.">
                <UInput v-model="form.feedback_prompt" class="w-full" placeholder="Wat kunnen we verbeteren?" />
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
