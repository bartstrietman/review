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

const reviews = computed(() => (feedback.value ?? []).filter(f => f.rating >= 4))
const improvements = computed(() => (feedback.value ?? []).filter(f => f.rating <= 3))

// Average of PUBLIC reviews only (4–5). The private 1–3 feedback never goes
// public, so mixing it into one "score" misleads the owner.
const avgReview = computed(() => {
  if (!reviews.value.length) return '—'
  return (reviews.value.reduce((s, f) => s + f.rating, 0) / reviews.value.length).toFixed(1).replace('.', ',')
})

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

      <template v-else>
        <div class="flex items-center gap-2 mb-5">
          <UBadge variant="subtle" color="neutral">{{ customer.package }}</UBadge>
          <UBadge variant="subtle" :color="statusColor(customer.status)">{{ customer.status }}</UBadge>
        </div>

        <!-- how it works -->
        <UAlert
          color="primary" variant="subtle" icon="i-lucide-info" class="mb-6"
          :title="t('dash.how.title')"
          :description="t('dash.how.body')"
        />

        <!-- stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <UCard>
            <p class="text-sm text-muted flex items-center gap-1.5"><UIcon name="i-lucide-star" class="size-4 text-gold-500" />{{ t('dash.stat.reviews') }}</p>
            <p class="font-display text-3xl font-bold mt-1">{{ reviews.length }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-muted">{{ t('dash.stat.avg') }}</p>
            <p class="font-display text-3xl font-bold mt-1">{{ avgReview }}<span v-if="avgReview !== '—'" class="text-lg text-muted"> / 5</span></p>
          </UCard>
          <UCard>
            <p class="text-sm text-muted">{{ t('dash.stat.improvements') }}</p>
            <p class="font-display text-3xl font-bold mt-1">{{ improvements.length }}</p>
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

        <!-- review link strip -->
        <UCard class="mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="sm:flex-1 min-w-0">
              <p class="text-sm font-semibold mb-0.5">{{ t('dash.link.title') }}</p>
              <p class="text-xs text-muted">{{ t('dash.link.hint') }} <code>?score=5</code></p>
            </div>
            <UInput :model-value="reviewUrl" readonly class="sm:flex-1 font-mono text-xs" :aria-label="t('dash.link.label')" />
            <UButton icon="i-lucide-copy" color="primary" class="shrink-0" @click="copy(reviewUrl)">{{ t('dash.link.copy') }}</UButton>
          </div>
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
      </template>
    </template>
  </UDashboardPanel>
</template>
