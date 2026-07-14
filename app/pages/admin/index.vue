<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

async function countOf(table: 'customers' | 'feedback', match?: Record<string, string>) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (match) query = query.match(match)
  const { count } = await query
  return count ?? 0
}

const { data: stats } = await useAsyncData('admin-stats', async () => ({
  customers: await countOf('customers'),
  active: await countOf('customers', { status: 'active' }),
  reviews: await countOf('feedback'),
}))

const { data: recent } = await useAsyncData('admin-recent-customers', async () => {
  const [{ data }, { data: logins }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, company_name, status, created_at, slug, user_id')
      .order('created_at', { ascending: false })
      .limit(5),
    // auth.users isn't client-readable → admin-only SECURITY DEFINER function.
    supabase.rpc('admin_user_logins'),
  ])
  const lastById = new Map((logins ?? []).map(l => [l.user_id, l.last_sign_in_at]))
  return (data ?? []).map(r => ({ ...r, last_login: lastById.get(r.user_id) ?? null }))
})

const cards = computed(() => [
  { label: 'Klanten', value: stats.value?.customers ?? 0, icon: 'i-lucide-users', to: '/admin/klanten' },
  { label: 'Actieve klanten', value: stats.value?.active ?? 0, icon: 'i-lucide-badge-check', to: '/admin/klanten' },
  { label: 'Reviews verzameld', value: stats.value?.reviews ?? 0, icon: 'i-lucide-star', to: '/admin/klanten' },
])
</script>

<template>
  <UDashboardPanel id="admin-home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton to="/admin/klanten/nieuw" icon="i-lucide-user-plus" color="primary">Klant toevoegen</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div class="min-w-0">
              <p class="font-medium truncate">{{ r.company_name || '—' }}</p>
              <p class="text-xs text-muted truncate">{{ r.slug }}</p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
              <div class="hidden sm:block text-right text-xs text-muted">
                <div>Aangemeld {{ relativeTime(r.created_at, 'nl') }}</div>
                <div class="mt-0.5 flex items-center justify-end gap-1.5">
                  <span class="size-1.5 rounded-full" :class="r.last_login ? 'bg-green-500' : 'bg-neutral-300'" />
                  <span>{{ r.last_login ? `ingelogd ${relativeTime(r.last_login, 'nl')}` : 'nog nooit ingelogd' }}</span>
                </div>
              </div>
              <UBadge variant="subtle" :color="statusColor(r.status)">{{ r.status }}</UBadge>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-muted py-6 text-center">Nog geen aanmeldingen.</p>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
