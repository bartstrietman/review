<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

type Row = {
  id: string; company_name: string | null; email: string | null; user_id: string
  status: string; created_at: string; slug: string; reviews: number
  last_login: string | null
}

const { data: rows, refresh } = await useAsyncData('admin-customers', async () => {
  const [{ data }, { data: logins }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, company_name, email, user_id, status, created_at, slug, feedback(count)')
      .order('created_at', { ascending: false }),
    // auth.users isn't client-readable → admin-only SECURITY DEFINER function.
    supabase.rpc('admin_user_logins'),
  ])
  const lastById = new Map((logins ?? []).map(l => [l.user_id, l.last_sign_in_at]))
  return ((data ?? []) as unknown as (Omit<Row, 'reviews' | 'last_login'> & { feedback: { count: number }[] })[])
    .map(r => ({ ...r, reviews: r.feedback?.[0]?.count ?? 0, last_login: lastById.get(r.user_id) ?? null }))
})

const columns: TableColumn<Row>[] = [
  { accessorKey: 'company_name', header: 'Bedrijf' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'reviews', header: 'Reviews verzameld' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'last_login', header: 'Laatste login' },
  { accessorKey: 'created_at', header: 'Aangemeld' },
  { id: 'actions', header: '' },
]

const statusOptions = ['trial', 'active', 'paused', 'cancelled']

const toast = useToast()
async function setStatus(row: Row, status: string) {
  const { error } = await supabase.from('customers').update({ status }).eq('id', row.id)
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: `Status → ${status}`, color: 'success' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="admin-klanten">
    <template #header>
      <UDashboardNavbar title="Klanten">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UBadge variant="subtle" color="neutral">{{ rows?.length ?? 0 }} totaal</UBadge>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="rows || []" :columns="columns" class="rounded-xl border border-default bg-white">
        <template #company_name-cell="{ row }">
          <NuxtLink :to="`/admin/klanten/${row.original.id}`" class="font-medium hover:text-green-700">
            {{ row.original.company_name || '—' }}
          </NuxtLink>
          <div class="text-xs text-muted">{{ row.original.slug }}</div>
        </template>
        <template #reviews-cell="{ row }">
          <span class="tabular-nums font-medium">{{ row.original.reviews }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge variant="subtle" :color="statusColor(row.original.status)">{{ row.original.status }}</UBadge>
        </template>
        <template #last_login-cell="{ row }">
          <span v-if="row.original.last_login" class="inline-flex items-center gap-1.5 text-sm">
            <span class="size-2 rounded-full bg-green-500 shrink-0" />
            {{ relativeTime(row.original.last_login, 'nl') }}
          </span>
          <span v-else class="inline-flex items-center gap-1.5 text-sm text-muted">
            <span class="size-2 rounded-full bg-neutral-300 shrink-0" />
            Nog nooit
          </span>
        </template>
        <template #created_at-cell="{ row }">
          <span class="text-sm text-muted">{{ fmtDate(row.original.created_at) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <UDropdownMenu
            :items="statusOptions.map(s => ({ label: `Status: ${s}`, onSelect: () => setStatus(row.original, s) }))"
          >
            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
          </UDropdownMenu>
        </template>
      </UTable>
      <p v-if="!rows || !rows.length" class="text-center text-sm text-muted py-10">Nog geen aanmeldingen.</p>
    </template>
  </UDashboardPanel>
</template>
