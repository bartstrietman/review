<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

type Row = {
  id: string; company_name: string | null; email: string | null
  status: string; created_at: string; slug: string; reviews: number
}

const { data: rows, refresh } = await useAsyncData('admin-customers', async () => {
  const { data } = await supabase
    .from('customers')
    .select('id, company_name, email, status, created_at, slug, feedback(count)')
    .order('created_at', { ascending: false })
  return ((data ?? []) as unknown as (Omit<Row, 'reviews'> & { feedback: { count: number }[] })[])
    .map(r => ({ ...r, reviews: r.feedback?.[0]?.count ?? 0 }))
})

const columns: TableColumn<Row>[] = [
  { accessorKey: 'company_name', header: 'Bedrijf' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'reviews', header: 'Reviews verzameld' },
  { accessorKey: 'status', header: 'Status' },
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
