<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

async function countOf(table: 'customers' | 'leads' | 'contact_messages' | 'feedback') {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count ?? 0
}

const { data: stats } = await useAsyncData('admin-stats', async () => ({
  customers: await countOf('customers'),
  leads: await countOf('leads'),
  contact: await countOf('contact_messages'),
  feedback: await countOf('feedback'),
}))

const { data: recent } = await useAsyncData('admin-recent-customers', async () => {
  const { data } = await supabase
    .from('customers')
    .select('id, company_name, package, status, created_at, slug')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
})

const cards = computed(() => [
  { label: 'Aanmeldingen', value: stats.value?.customers ?? 0, icon: 'i-lucide-users', to: '/admin/klanten' },
  { label: 'Leads', value: stats.value?.leads ?? 0, icon: 'i-lucide-inbox', to: '/admin/leads' },
  { label: 'Contactberichten', value: stats.value?.contact ?? 0, icon: 'i-lucide-mail', to: '/admin/leads' },
  { label: 'Privé-feedback', value: stats.value?.feedback ?? 0, icon: 'i-lucide-message-square', to: '/admin/feedback' },
])

function statusColor(s: string) {
  return s === 'active' ? 'success' : s === 'trial' ? 'primary' : s === 'paused' ? 'warning' : 'neutral'
}
</script>

<template>
  <UDashboardPanel id="admin-home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="c in cards" :key="c.label" :to="c.to">
          <UCard class="hover:ring-2 hover:ring-primary/30 transition">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">{{ c.label }}</p>
                <p class="font-display text-3xl font-bold mt-1">{{ c.value }}</p>
              </div>
              <UIcon :name="c.icon" class="size-7 text-green-700" />
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Recente aanmeldingen</h3>
            <UButton to="/admin/klanten" size="xs" variant="link" trailing-icon="i-lucide-arrow-right">Alle klanten</UButton>
          </div>
        </template>
        <div v-if="recent && recent.length" class="divide-y divide-default">
          <NuxtLink
            v-for="r in recent" :key="r.id"
            :to="`/admin/klanten/${r.id}`"
            class="flex items-center justify-between py-3 hover:bg-elevated -mx-2 px-2 rounded-lg"
          >
            <div>
              <p class="font-medium">{{ r.company_name || '—' }}</p>
              <p class="text-xs text-muted">{{ r.slug }}</p>
            </div>
            <div class="flex items-center gap-3">
              <UBadge variant="subtle" color="neutral">{{ r.package }}</UBadge>
              <UBadge variant="subtle" :color="statusColor(r.status)">{{ r.status }}</UBadge>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-muted py-6 text-center">Nog geen aanmeldingen.</p>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
