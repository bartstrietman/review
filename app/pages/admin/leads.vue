<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const supabase = useSupabaseClient<Database>()

const { data: leads } = await useAsyncData('admin-leads', async () => {
  const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  return data ?? []
})
const { data: messages } = await useAsyncData('admin-contact', async () => {
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  return data ?? []
})

const tab = ref('leads')
const items = [
  { label: 'Leads', value: 'leads', icon: 'i-lucide-inbox' },
  { label: 'Contactberichten', value: 'contact', icon: 'i-lucide-mail' },
]
function fmt(d: string) { return new Date(d).toLocaleString('nl-NL') }
</script>

<template>
  <UDashboardPanel id="admin-leads">
    <template #header>
      <UDashboardNavbar title="Leads & contact">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTabs v-model="tab" :items="items" class="mb-5" />

      <div v-if="tab === 'leads'">
        <div v-if="leads && leads.length" class="rounded-xl border border-default bg-white divide-y divide-default">
          <div v-for="l in leads" :key="l.id" class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="font-medium">{{ l.email }}</p>
              <p class="text-xs text-muted">{{ l.source }}</p>
            </div>
            <span class="text-xs text-muted">{{ fmt(l.created_at) }}</span>
          </div>
        </div>
        <p v-else class="text-center text-muted py-10 text-sm">Nog geen leads.</p>
      </div>

      <div v-else>
        <div v-if="messages && messages.length" class="space-y-3">
          <UCard v-for="m in messages" :key="m.id">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{{ m.name || '—' }}</p>
                <p class="text-xs text-muted">{{ m.email }}</p>
              </div>
              <span class="text-xs text-muted">{{ fmt(m.created_at) }}</span>
            </div>
            <p class="mt-2 text-sm">{{ m.message }}</p>
          </UCard>
        </div>
        <p v-else class="text-center text-muted py-10 text-sm">Nog geen contactberichten.</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
