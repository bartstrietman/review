<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()
const { customer } = useMyBusiness()

// Sent invites with tracking status (RLS scopes to the owner's rows).
const { data: invites } = await useAsyncData(
  'dash-invites',
  async () => {
    if (!customer.value) return []
    const { data } = await supabase
      .from('invites')
      .select('id, email, status, created_at')
      .eq('customer_id', customer.value.id)
      .order('created_at', { ascending: false })
      .limit(200)
    return data ?? []
  },
  { watch: [customer] },
)

const STATUS_COLOR: Record<string, 'neutral' | 'error' | 'secondary' | 'primary'> = {
  pending: 'neutral', sent: 'neutral', failed: 'error', opened: 'secondary', completed: 'primary',
}

// Small status roll-up shown above the list.
const counts = computed(() => {
  const c = { total: 0, opened: 0, completed: 0 }
  for (const inv of invites.value ?? []) {
    c.total++
    if (inv.status === 'opened') c.opened++
    if (inv.status === 'completed') c.completed++
  }
  return c
})

usePageTitle(t('dash.nav.sent'))
</script>

<template>
  <UDashboardPanel id="dash-sent">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.sent')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton :to="localePath('/dashboard/emails')" icon="i-lucide-send" color="primary" size="sm">
            {{ t('dash.invite.compose') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl mx-auto w-full space-y-6">
        <p class="text-muted text-sm">{{ t('dash.invite.historyHint') }}</p>

        <div v-if="counts.total" class="grid grid-cols-3 gap-4">
          <UCard>
            <p class="text-2xl font-bold">{{ counts.total }}</p>
            <p class="text-xs text-muted">{{ t('dash.invite.history') }}</p>
          </UCard>
          <UCard>
            <p class="text-2xl font-bold">{{ counts.opened }}</p>
            <p class="text-xs text-muted">{{ t('dash.invite.status.opened') }}</p>
          </UCard>
          <UCard>
            <p class="text-2xl font-bold">{{ counts.completed }}</p>
            <p class="text-xs text-muted">{{ t('dash.invite.status.completed') }}</p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <h2 class="font-semibold">{{ t('dash.invite.history') }}</h2>
          </template>

          <div v-if="!invites?.length" class="py-10 text-center">
            <UIcon name="i-lucide-mail-plus" class="size-8 text-muted mx-auto mb-3" />
            <p class="text-sm text-muted mb-4">{{ t('dash.invite.historyEmpty') }}</p>
            <UButton :to="localePath('/dashboard/emails')" icon="i-lucide-send" color="primary">
              {{ t('dash.invite.compose') }}
            </UButton>
          </div>

          <ul v-else class="divide-y divide-default">
            <li v-for="inv in invites" :key="inv.id" class="flex items-center justify-between gap-3 py-3">
              <span class="text-sm truncate">{{ inv.email }}</span>
              <span class="flex items-center gap-3 shrink-0">
                <span class="text-xs text-muted">{{ relativeTime(inv.created_at, locale as 'nl' | 'en') }}</span>
                <UBadge :color="STATUS_COLOR[inv.status] ?? 'neutral'" variant="subtle" size="sm">
                  {{ t(`dash.invite.status.${inv.status}`) }}
                </UBadge>
              </span>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
