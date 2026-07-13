<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient<Database>()

const form = reactive({
  company_name: '', email: '', street: '', postcode: '', city: '', phone: '',
  website: '', google_url: '', google_place_id: '',
  bg_color: '#0F3D2E', text_color: '#FFFFFF',
})

const brand = reactive<{ colors: string[], logo: string | null, scanned: string }>({
  colors: [], logo: null, scanned: '',
})

// Logo the admin picked by hand — overrides the one plucked from the site.
// The customer row doesn't exist yet, so we hold the file and upload it to
// Storage once we have the new customer id (in submit()).
const LOGO_TYPES: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
}
const LOGO_MAX = 2_000_000
const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const logoInputEl = ref<HTMLInputElement>()

function onLogoPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (logoInputEl.value) logoInputEl.value.value = ''
  if (!file) return
  if (!LOGO_TYPES[file.type]) { toast.add({ title: 'Alleen PNG, JPG, WebP, GIF of SVG', color: 'error' }); return }
  if (file.size > LOGO_MAX) { toast.add({ title: 'Bestand te groot (max 2 MB)', color: 'error' }); return }
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

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

// Pick a scanned website colour as the background and auto-set a readable text
// colour (same luminance threshold as the server-side brand-scan suggestion).
function contrastText(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return form.text_color
  const n = Number.parseInt(m[1]!, 16)
  const chan = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const lum = 0.2126 * lin(chan[0]!) + 0.7152 * lin(chan[1]!) + 0.0722 * lin(chan[2]!)
  return lum > 0.179 ? '#1A1A1A' : '#FFFFFF'
}
function applyBrandColor(hex: string) {
  form.bg_color = hex.toUpperCase()
  form.text_color = contrastText(hex)
}

const creating = ref(false)
async function submit() {
  if (!form.company_name || !form.email) {
    toast.add({ title: 'Bedrijfsnaam en e-mail zijn verplicht.', color: 'error' })
    return
  }
  creating.value = true
  try {
    // A hand-picked file wins over the scanned logo; upload it after creation.
    const res = await $fetch<{ id: string, slug: string, invited: boolean }>('/api/admin/customers', {
      method: 'POST',
      body: { ...form, logo_url: logoFile.value ? undefined : (brand.logo || undefined) },
    })
    if (logoFile.value) {
      const ext = LOGO_TYPES[logoFile.value.type]
      const path = `${res.id}/${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('logos').upload(path, logoFile.value, { upsert: false, contentType: logoFile.value.type })
      if (upErr) { toast.add({ title: `Logo uploaden mislukt: ${upErr.message}`, color: 'warning' }) }
      else {
        const publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
        await supabase.from('customers').update({ logo_url: publicUrl }).eq('id', res.id)
      }
    }
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
              <div v-if="brand.colors.length">
                <p class="text-xs font-medium text-muted mb-1.5">Kleuren van de website</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="c in brand.colors" :key="c" type="button"
                    class="size-8 rounded-md border border-default transition hover:scale-110"
                    :class="{ 'ring-2 ring-offset-2 ring-primary': form.bg_color.toUpperCase() === c.toUpperCase() }"
                    :style="{ background: c }" :title="c"
                    @click="applyBrandColor(c)"
                  />
                </div>
              </div>
              <ColorField v-model="form.bg_color" label="Achtergrondkleur" />
              <ColorField v-model="form.text_color" label="Tekstkleur" />
              <div class="rounded-xl p-5 text-center font-semibold" :style="{ background: form.bg_color, color: form.text_color }">
                Hoe was uw ervaring?
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-semibold">Logo</h3></template>
            <div class="flex items-center gap-4">
              <div class="size-16 rounded-lg border border-default bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="logoPreview || brand.logo" :src="logoPreview || brand.logo!" alt="" class="size-full object-contain">
                <UIcon v-else name="i-lucide-image" class="size-6 text-muted" />
              </div>
              <div>
                <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-upload" @click="logoInputEl?.click()">
                  {{ (logoPreview || brand.logo) ? 'Ander logo' : 'Logo uploaden' }}
                </UButton>
                <p class="text-xs text-muted mt-1.5">
                  {{ brand.logo && !logoPreview ? 'Automatisch van de website — of upload een eigen bestand.' : 'PNG, JPG, WebP, GIF of SVG — max 2 MB.' }}
                </p>
                <input
                  ref="logoInputEl" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  class="hidden" @change="onLogoPick"
                >
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
