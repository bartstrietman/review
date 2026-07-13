<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const origin = useRequestURL().origin
const { customer } = useMyBusiness()

const { data: feedback, refresh } = await useAsyncData('dash-feedback', async () => {
  if (!customer.value) return []
  const { data } = await supabase
    .from('feedback')
    .select('id, rating, message, created_at')
    .eq('customer_id', customer.value.id)
    .order('created_at', { ascending: false })
  return data ?? []
}, { watch: [customer] })

// Google-score history (server refreshes today's snapshot when needed).
const requestFetch = useRequestFetch()
const { data: google } = await useAsyncData('dash-google', async () => {
  if (!customer.value) return null
  try {
    return await requestFetch<{ placeLinked: boolean; history: { rating: number | null; review_count: number | null; captured_at: string }[] }>(
      '/api/google-score',
      { query: { customer_id: customer.value.id } },
    )
  }
  catch { return null }
}, { watch: [customer] })

// Invite stats feed the honest attribution line + the tempo card footer.
const { data: inviteStats } = await useAsyncData('dash-invite-stats', async () => {
  if (!customer.value) return { sent: 0, completed: 0 }
  const { data } = await supabase
    .from('invites')
    .select('status')
    .eq('customer_id', customer.value.id)
  const rows = data ?? []
  return {
    sent: rows.filter(r => ['sent', 'opened', 'completed'].includes(r.status)).length,
    completed: rows.filter(r => r.status === 'completed').length,
  }
}, { watch: [customer] })

const reviews = computed(() => (feedback.value ?? []).filter(f => f.rating >= 4))
const improvements = computed(() => (feedback.value ?? []).filter(f => f.rating <= 3))

const reviewUrl = computed(() => customer.value ? `${origin}/r/${customer.value.slug}` : '')
const hasAny = computed(() => (feedback.value?.length ?? 0) > 0)

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.add({ title: 'Gekopieerd', color: 'success', icon: 'i-lucide-check' }) }
  catch { toast.add({ title: 'Kon niet kopiëren', color: 'error' }) }
}

const tab = ref('reviews')
const tabItems = computed(() => [
  { label: `${t('dash.tabReviews')} (${reviews.value.length})`, value: 'reviews', icon: 'i-lucide-star' },
  { label: `${t('dash.tabImpr')} (${improvements.value.length})`, value: 'improvements', icon: 'i-lucide-message-square-warning' },
])
function statusColor(s: string) {
  return s === 'active' ? 'success' : s === 'trial' ? 'primary' : s === 'paused' ? 'warning' : 'neutral'
}

usePageTitle('Overzicht')
</script>

<template>
  <UDashboardPanel id="dash-overview">
    <template #header>
      <UDashboardNavbar :title="customer?.company_name || t('dash.nav.overview')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton :to="`/r/${customer?.slug}`" target="_blank" color="neutral" variant="soft" icon="i-lucide-external-link" size="sm">
            {{ t('dash.reviewPage') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="!customer" class="text-center py-20">
        <UIcon name="i-lucide-store" class="size-12 text-dimmed mx-auto mb-4" />
        <h2 class="text-xl font-semibold">{{ t('dash.noWidget') }}</h2>
        <p class="text-muted mt-2 mb-5">{{ t('dash.noBiz') }}</p>
        <UButton :to="localePath('/aanmelden')" color="primary">{{ t('dash.signup') }}</UButton>
      </div>

      <!-- single wrapper: the panel body is a flex column; cards with
           overflow-hidden would otherwise be squashed as flex items -->
      <div v-else>
        <div class="flex items-center gap-2 mb-5">
          <UBadge variant="subtle" color="neutral">{{ customer.package }}</UBadge>
          <UBadge variant="subtle" :color="statusColor(customer.status)">{{ customer.status }}</UBadge>
        </div>

        <!-- how it works (first run only) -->
        <UAlert
          v-if="!hasAny"
          color="primary" variant="subtle" icon="i-lucide-info" class="mb-6"
          :title="t('dash.how.title')"
          :description="t('dash.how.body')"
        />

        <!-- Google score hero -->
        <DashboardGoogleScoreCard
          class="mb-8"
          :place-linked="google?.placeLinked ?? false"
          :history="google?.history ?? []"
          :invites-sent="inviteStats?.sent ?? 0"
          :invites-completed="inviteStats?.completed ?? 0"
        />

        <!-- keep the tempo: the three ways to collect reviews -->
        <div class="mb-2 flex items-baseline gap-2 flex-wrap">
          <h2 class="font-display font-bold">{{ t('dash.tempo.title') }}</h2>
          <span class="text-sm text-muted">{{ t('dash.tempo.sub') }}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UCard class="ring-1 ring-green-200">
            <div class="size-11 rounded-xl bg-green-800 flex items-center justify-center mb-3.5">
              <UIcon name="i-lucide-send" class="size-5 text-gold-400" />
            </div>
            <h3 class="font-semibold text-[17px] mb-1.5">{{ t('dash.tempo.inviteT') }}</h3>
            <p class="text-sm text-muted mb-5">
              {{ (inviteStats?.completed ?? 0) > 0 ? t('dash.tempo.inviteWorking', { n: inviteStats!.completed }) : t('dash.tempo.inviteD') }}
            </p>
            <UButton :to="localePath('/dashboard/uitnodigen')" size="lg" class="bg-green-800 hover:bg-green-700 text-white px-5 font-semibold">
              {{ t('dash.tempo.inviteCta') }}
            </UButton>
            <p v-if="(inviteStats?.sent ?? 0) > 0" class="text-xs text-muted mt-3.5 flex items-center gap-1">
              <UIcon name="i-lucide-check" class="size-3.5 text-green-600" />
              {{ t('dash.tempo.inviteStats', { sent: inviteStats!.sent, done: inviteStats!.completed }) }}
            </p>
          </UCard>

          <UCard>
            <div class="size-11 rounded-xl bg-green-50 flex items-center justify-center mb-3.5">
              <UIcon name="i-lucide-link" class="size-5 text-green-700" />
            </div>
            <h3 class="font-semibold text-[17px] mb-1.5">{{ t('dash.tempo.linkT') }}</h3>
            <p class="text-sm text-muted mb-5">{{ t('dash.tempo.linkD') }}</p>
            <div class="flex items-center gap-2 rounded-xl border border-default p-1.5">
              <span class="flex-1 truncate font-mono text-xs px-2" :title="reviewUrl">{{ reviewUrl }}</span>
              <UButton icon="i-lucide-copy" color="neutral" variant="outline" class="bg-white shrink-0" @click="copy(reviewUrl)">
                {{ t('dash.link.copy') }}
              </UButton>
            </div>
          </UCard>

          <UCard>
            <div class="size-11 rounded-xl bg-green-50 flex items-center justify-center mb-3.5">
              <UIcon name="i-lucide-code" class="size-5 text-green-700" />
            </div>
            <h3 class="font-semibold text-[17px] mb-1.5">{{ t('dash.tempo.widgetT') }}</h3>
            <p class="text-sm text-muted mb-5">{{ t('dash.tempo.widgetD') }}</p>
            <UButton :to="localePath('/dashboard/widget') + '?step=2'" color="primary" variant="soft" size="lg" class="px-5 font-semibold">
              {{ t('dash.tempo.widgetCta') }}
            </UButton>
          </UCard>
        </div>

        <!-- first-run checklist -->
        <UCard v-if="!hasAny" class="mb-6">
          <template #header><h2 class="font-semibold">{{ t('dash.start.title') }}</h2></template>
          <ol class="space-y-3">
            <li class="flex items-start gap-3">
              <span class="size-6 shrink-0 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">1</span>
              <div>
                <p class="text-sm font-medium">{{ t('dash.start.s1') }}</p>
                <p class="text-xs text-muted">{{ t('dash.start.s1d') }}</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="size-6 shrink-0 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">2</span>
              <div>
                <p class="text-sm font-medium">{{ t('dash.start.s2') }} <NuxtLink :to="localePath('/dashboard/widget') + '?step=2'" class="text-green-700 underline">→ {{ t('dash.widget.step2') }}</NuxtLink></p>
                <p class="text-xs text-muted">{{ t('dash.start.s2d') }}</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="size-6 shrink-0 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">3</span>
              <div>
                <p class="text-sm font-medium">{{ t('dash.start.s3') }} <NuxtLink :to="localePath('/dashboard/uitnodigen')" class="text-green-700 underline">→ {{ t('dash.nav.invite') }}</NuxtLink></p>
                <p class="text-xs text-muted">{{ t('dash.start.s3d') }}</p>
              </div>
            </li>
          </ol>
        </UCard>

        <!-- reviews -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t('dash.received') }}</h2>
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-refresh-cw" :aria-label="t('dash.link.refresh')" @click="refresh()" />
            </div>
          </template>

          <UTabs v-model="tab" :items="tabItems" class="mb-4" />

          <div v-if="tab === 'reviews'">
            <div v-if="reviews.length" class="space-y-3">
              <div v-for="f in reviews" :key="f.id" class="rounded-xl border border-default p-4">
                <div class="flex items-center justify-between">
                  <StarRating :size="15" :filled="f.rating" readonly class="!justify-start" />
                  <span class="text-xs text-muted">{{ relativeTime(f.created_at, locale as 'nl' | 'en') }}</span>
                </div>
                <p class="mt-2 text-sm">{{ f.message || '—' }}</p>
              </div>
            </div>
            <div v-else class="text-center text-muted py-10 text-sm">
              <UIcon name="i-lucide-star-off" class="size-9 mx-auto mb-2 text-dimmed" />
              {{ t('dash.emptyReviews') }} <NuxtLink :to="localePath('/dashboard/uitnodigen')" class="text-green-700 underline">{{ t('dash.inviteCustomers') }}</NuxtLink>.
            </div>
          </div>

          <div v-else>
            <div v-if="improvements.length" class="space-y-3">
              <div v-for="f in improvements" :key="f.id" class="rounded-xl border border-default p-4">
                <div class="flex items-center justify-between">
                  <StarRating :size="15" :filled="f.rating" readonly class="!justify-start" />
                  <span class="text-xs text-muted">{{ relativeTime(f.created_at, locale as 'nl' | 'en') }}</span>
                </div>
                <p class="mt-2 text-sm">{{ f.message || '—' }}</p>
              </div>
            </div>
            <div v-else class="text-center text-muted py-10 text-sm">
              <UIcon name="i-lucide-message-square-dashed" class="size-9 mx-auto mb-2 text-dimmed" />
              {{ t('dash.emptyImpr') }}
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
