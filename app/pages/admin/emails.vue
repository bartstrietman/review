<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type Row = {
  id: string; direction: 'sent' | 'received'; from: string; to: string
  subject: string; created_at: string; status: string
}

const { data: rows, status, error, refresh } = await useAsyncData(
  'admin-emails',
  () => $fetch<Row[]>('/api/admin/emails'),
)

const columns: TableColumn<Row>[] = [
  { accessorKey: 'direction', header: '' },
  { accessorKey: 'from', header: 'Van' },
  { accessorKey: 'to', header: 'Aan' },
  { accessorKey: 'subject', header: 'Onderwerp' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Datum' },
]

function statusColorFor(s: string): 'success' | 'error' | 'primary' | 'neutral' {
  if (['delivered', 'sent'].includes(s)) return 'success'
  if (['opened', 'clicked'].includes(s)) return 'primary'
  if (['bounced', 'complained', 'failed', 'delivery_delayed'].includes(s)) return 'error'
  return 'neutral'
}
const fmtDateTime = (d: string) =>
  d ? new Date(d).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '—'
</script>

<template>
  <UDashboardPanel id="admin-emails">
    <template #header>
      <UDashboardNavbar title="E-mails">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UBadge variant="subtle" color="neutral">{{ rows?.length ?? 0 }} laatste</UBadge>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="status === 'pending'" @click="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="error" color="error" variant="subtle" icon="i-lucide-triangle-alert"
        title="Kon e-mails niet laden" :description="error.statusMessage || error.message"
      />
      <template v-else>
        <UTable :data="rows || []" :columns="columns" :loading="status === 'pending'" class="rounded-xl border border-default bg-white">
          <template #direction-cell="{ row }">
            <UIcon
              :name="row.original.direction === 'sent' ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-left'"
              :class="row.original.direction === 'sent' ? 'text-green-700' : 'text-blue-600'"
              class="size-4"
              :title="row.original.direction === 'sent' ? 'Verzonden' : 'Ontvangen'"
            />
          </template>
          <template #from-cell="{ row }"><span class="text-sm">{{ row.original.from }}</span></template>
          <template #to-cell="{ row }"><span class="text-sm">{{ row.original.to }}</span></template>
          <template #subject-cell="{ row }"><span class="font-medium">{{ row.original.subject || '—' }}</span></template>
          <template #status-cell="{ row }">
            <UBadge v-if="row.original.status" variant="subtle" :color="statusColorFor(row.original.status)">{{ row.original.status }}</UBadge>
          </template>
          <template #created_at-cell="{ row }">
            <span class="text-sm text-muted tabular-nums">{{ fmtDateTime(row.original.created_at) }}</span>
          </template>
        </UTable>
        <p v-if="rows && !rows.length" class="text-center text-sm text-muted py-10">Nog geen e-mails.</p>
      </template>
    </template>
  </UDashboardPanel>
</template>
