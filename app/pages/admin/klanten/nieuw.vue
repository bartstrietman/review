<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const toast = useToast()

const form = reactive({
  company_name: '', email: '', street: '', postcode: '', city: '', phone: '',
  website: '', google_url: '', google_place_id: '',
  bg_color: '#0F3D2E', text_color: '#FFFFFF',
})

const brand = reactive<{ colors: string[], logo: string | null, scanned: string }>({
  colors: [], logo: null, scanned: '',
})

function onPlaceSelect(p: import('~/components/Signup/BusinessSearch.vue').PlaceResult) {
  form.company_name = p.title || form.company_name
  if (p.street) form.street = p.street
  if (p.postcode) form.postcode = p.postcode
  if (p.city) form.city = p.city
  if (p.phone) form.phone = p.phone
  if (p.website) form.website = p.website
  if (p.reviewUrl) form.google_url = p.reviewUrl
  if (p.placeId) form.google_place_id = p.placeId
  if (form.website) scanBrand()
}

async function scanBrand() {
  const url = form.website.trim()
  if (!url || url === brand.scanned) return
  brand.scanned = url
  try {
    const res = await $fetch<{ colors: string[], suggestedBg: string | null, suggestedText: string | null, logo: string | null }>(
      '/api/brand-scan',
      { method: 'POST', body: { url } },
    )
    brand.colors = res.colors
    brand.logo = res.logo
    if (res.suggestedBg && form.bg_color === '#0F3D2E') {
      form.bg_color = res.suggestedBg
      if (res.suggestedText) form.text_color = res.suggestedText
    }
  }
  catch { /* stil: defaults blijven staan */ }
}

const creating = ref(false)
async function submit() {
  if (!form.company_name || !form.email) {
    toast.add({ title: 'Bedrijfsnaam en e-mail zijn verplicht.', color: 'error' })
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ id: string, slug: string, invited: boolean }>('/api/admin/customers', {
      method: 'POST',
      body: { ...form, logo_url: brand.logo || undefined },
    })
    toast.add({ title: 'Klant aangemaakt', color: 'success', icon: 'i-lucide-check' })
    if (!res.invited) toast.add({ title: 'Account gemaakt, uitnodiging is niet verstuurd.', color: 'warning' })
    await router.push(`/admin/klanten/${res.id}`)
  }
  catch (e: unknown) {
    toast.add({ title: (e as { statusMessage?: string })?.statusMessage ?? 'Aanmaken mislukt', color: 'error' })
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="admin-klant-nieuw">
    <template #header>
      <UDashboardNavbar title="Klant toevoegen">
        <template #leading>
          <UButton to="/admin/klanten" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
        </template>
        <template #right>
          <UButton color="primary" icon="i-lucide-user-plus" :loading="creating" @click="submit">Aanmaken & uitnodigen</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header><h3 class="font-semibold">Bedrijf zoeken</h3></template>
            <SignupBusinessSearch @select="onPlaceSelect" />
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Bedrijfsnaam"><UInput v-model="form.company_name" class="w-full" /></UFormField>
              <UFormField label="E-mail"><UInput v-model="form.email" type="email" class="w-full" /></UFormField>
              <UFormField label="Straat + huisnummer"><UInput v-model="form.street" class="w-full" /></UFormField>
              <UFormField label="Postcode"><UInput v-model="form.postcode" class="w-full" /></UFormField>
              <UFormField label="Plaats"><UInput v-model="form.city" class="w-full" /></UFormField>
              <UFormField label="Telefoon"><UInput v-model="form.phone" class="w-full" /></UFormField>
              <UFormField label="Website" class="sm:col-span-2">
                <UInput v-model="form.website" type="url" class="w-full" @blur="scanBrand" />
              </UFormField>
              <UFormField label="Google review-URL" class="sm:col-span-2"><UInput v-model="form.google_url" class="w-full" /></UFormField>
            </div>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header><h3 class="font-semibold">Huisstijl</h3></template>
            <div class="space-y-4">
              <div v-if="brand.colors.length" class="flex flex-wrap gap-2">
                <button
                  v-for="c in brand.colors" :key="c" type="button"
                  class="size-8 rounded-md border border-default"
                  :style="{ background: c }"
                  @click="form.bg_color = c"
                />
              </div>
              <UFormField label="Achtergrondkleur">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: form.bg_color }" />
                  <UInput v-model="form.bg_color" class="w-32" />
                </div>
              </UFormField>
              <UFormField label="Tekstkleur">
                <div class="flex items-center gap-2">
                  <span class="size-8 rounded-md border border-default" :style="{ background: form.text_color }" />
                  <UInput v-model="form.text_color" class="w-32" />
                </div>
              </UFormField>
              <div class="rounded-xl p-5 text-center font-semibold" :style="{ background: form.bg_color, color: form.text_color }">
                Hoe was uw ervaring?
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Logo</h3></template>
            <img v-if="brand.logo" :src="brand.logo" alt="" class="max-h-16 max-w-full object-contain">
            <p v-else class="text-sm text-muted">Geen logo gevonden — klant kan later uploaden.</p>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
