<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

const { data: rows } = await useAsyncData('admin-feedback', async () => {
  const { data } = await supabase
    .from('feedback')
    .select('id, rating, message, created_at, customer_id')
    .order('created_at', { ascending: false })
  return data ?? []
})
</script>

<template>
  <UDashboardPanel id="admin-feedback">
    <template #header>
      <UDashboardNavbar title="Privé-feedback">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        color="neutral" variant="soft" icon="i-lucide-info"
        title="Komt beschikbaar met de widget"
        description="Privé-feedback (1–3 sterren) verschijnt hier zodra de embeddable widget live is. Het schema en deze weergave staan al klaar."
        class="mb-6"
      />

      <div v-if="rows && rows.length" class="space-y-3">
        <UCard v-for="f in rows" :key="f.id">
          <div class="flex items-center justify-between">
            <StarRating :size="16" :filled="f.rating" readonly class="!justify-start" />
            <span class="text-xs text-muted">{{ new Date(f.created_at).toLocaleString('nl-NL') }}</span>
          </div>
          <p class="mt-2 text-sm">{{ f.message }}</p>
        </UCard>
      </div>
      <div v-else class="text-center text-muted py-10">
        <UIcon name="i-lucide-message-square-dashed" class="size-10 mx-auto mb-3 opacity-50" />
        <p class="text-sm">Nog geen feedback ontvangen.</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
