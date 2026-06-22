<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

const { data: rows } = await useAsyncData('admin-feedback', async () => {
  const { data } = await supabase
    .from('feedback')
    .select('id, rating, message, created_at, customers(company_name)')
    .order('created_at', { ascending: false })
  return data ?? []
})

const reviews = computed(() => (rows.value ?? []).filter(r => r.rating >= 4))
const improvements = computed(() => (rows.value ?? []).filter(r => r.rating <= 3))

const tab = ref('improvements')
const items = computed(() => [
  { label: `Verbeterpunten (${improvements.value.length})`, value: 'improvements', icon: 'i-lucide-message-square-warning' },
  { label: `Reviews (${reviews.value.length})`, value: 'reviews', icon: 'i-lucide-star' },
])

function company(r: { customers: { company_name: string | null } | null }) {
  return r.customers?.company_name ?? '—'
}
function fmt(d: string) { return new Date(d).toLocaleString('nl-NL') }
</script>

<template>
  <UDashboardPanel id="admin-feedback">
    <template #header>
      <UDashboardNavbar title="Feedback & reviews">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTabs v-model="tab" :items="items" class="mb-5" />

      <div :class="tab === 'improvements' ? '' : 'hidden'">
        <div v-if="improvements.length" class="space-y-3">
          <UCard v-for="f in improvements" :key="f.id">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <StarRating :size="15" :filled="f.rating" readonly class="!justify-start" />
                <span class="text-sm font-medium">{{ company(f) }}</span>
              </div>
              <span class="text-xs text-muted">{{ fmt(f.created_at) }}</span>
            </div>
            <p class="mt-2 text-sm">{{ f.message || '—' }}</p>
          </UCard>
        </div>
        <div v-else class="text-center text-muted py-10">
          <UIcon name="i-lucide-message-square-dashed" class="size-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">Nog geen verbeterpunten (1–3 sterren) ontvangen.</p>
        </div>
      </div>

      <div :class="tab === 'reviews' ? '' : 'hidden'">
        <div v-if="reviews.length" class="space-y-3">
          <UCard v-for="f in reviews" :key="f.id">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <StarRating :size="15" :filled="f.rating" readonly class="!justify-start" />
                <span class="text-sm font-medium">{{ company(f) }}</span>
              </div>
              <span class="text-xs text-muted">{{ fmt(f.created_at) }}</span>
            </div>
            <p class="mt-2 text-sm">{{ f.message || '—' }}</p>
          </UCard>
        </div>
        <div v-else class="text-center text-muted py-10">
          <UIcon name="i-lucide-star-off" class="size-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">Nog geen reviews (4–5 sterren) ontvangen.</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
