<script setup lang="ts">
// Google-score hero for the dashboard. Three states:
//  - 'link'  : no Place ID linked yet → promise CTA + ghost chart
//  - 'start' : one snapshot → baseline framing ("jouw startpunt")
//  - 'trend' : ≥2 snapshots → review-count chart + honest score line
interface Snapshot { rating: number | null; review_count: number | null; captured_at: string }

const props = defineProps<{
  placeLinked: boolean
  history: Snapshot[]
  invitesSent: number
  invitesCompleted: number
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const state = computed(() => {
  if (!props.placeLinked) return 'link'
  return props.history.length >= 2 ? 'trend' : 'start'
})

const first = computed(() => props.history[0] ?? null)
const latest = computed(() => props.history.at(-1) ?? null)
const countDelta = computed(() => (latest.value?.review_count ?? 0) - (first.value?.review_count ?? 0))
const ratingMoved = computed(() => (latest.value?.rating ?? 0) !== (first.value?.rating ?? 0))

const fmtRating = (v: number | null | undefined) => v == null ? '—' : v.toFixed(1).replace('.', ',')
const fmtDate = (iso: string | undefined) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long' }).format(new Date(iso))
}
const dateRange = computed(() => first.value && latest.value ? `${fmtDate(first.value.captured_at)} – ${fmtDate(latest.value.captured_at)}` : '')

// Honest attribution: only claim what the invite tracking actually measured.
const attribution = computed(() => {
  const d = countDelta.value
  const c = props.invitesCompleted
  if (d <= 0 || c <= 0) return ''
  if (c >= d) return t('dash.google.attrAll')
  return t('dash.google.attrSome', { n: c })
})

const chartValues = computed(() => props.history.map(s => s.review_count ?? 0))
</script>

<template>
  <!-- STATE: not linked — sell the future self -->
  <UCard v-if="state === 'link'">
    <div class="grid lg:grid-cols-2 gap-6 items-center">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
          <UIcon name="i-lucide-trending-up" class="size-4 text-green-600" />{{ t('dash.google.eyebrow') }}
        </p>
        <h2 class="font-display text-2xl font-bold mb-2">{{ t('dash.google.linkH') }}</h2>
        <p class="text-sm text-muted mb-4">{{ t('dash.google.linkB') }}</p>
        <UButton :to="localePath('/dashboard/instellingen')" color="primary" icon="i-lucide-link">
          {{ t('dash.set.placeSearch') }}
        </UButton>
      </div>
      <div class="relative hidden lg:block">
        <DashboardScoreTrend :values="[75, 76, 78, 79, 83, 86]" ghost />
        <span class="absolute top-1 right-2 text-[11px] font-medium text-dimmed border border-dashed border-default rounded-full px-2 py-0.5">
          {{ t('dash.google.ghostTag') }}
        </span>
      </div>
    </div>
  </UCard>

  <!-- STATE: just linked — frame the baseline -->
  <UCard v-else-if="state === 'start'">
    <!-- top-align: the baseline copy is short, so items-center would leave a
         big empty gap above it next to the taller ghost chart. -->
    <div class="grid lg:grid-cols-2 gap-6 items-start">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-3">
          <UIcon name="i-lucide-map-pin-check" class="size-4 text-green-600" />{{ t('dash.google.eyebrow') }}
        </p>
        <div class="flex items-end gap-3 mb-2">
          <span class="font-display text-6xl font-bold leading-none">{{ fmtRating(latest?.rating) }}</span>
          <div class="pb-1">
            <StarRating :size="16" :filled="Math.round(latest?.rating ?? 0)" readonly class="!justify-start" />
            <p class="text-sm text-muted mt-0.5">{{ latest?.review_count ?? '—' }} {{ t('dash.google.reviewsOn') }}</p>
          </div>
        </div>
        <UBadge color="secondary" variant="subtle" class="mb-2">{{ t('dash.google.startChip') }}</UBadge>
        <p class="text-sm text-muted">{{ t('dash.google.startB', { date: fmtDate(latest?.captured_at) }) }}</p>
      </div>
      <div class="relative hidden lg:block">
        <DashboardScoreTrend :values="[75, 76, 78, 79, 83, 86]" ghost />
        <span class="absolute top-1 right-2 text-[11px] font-medium text-dimmed border border-dashed border-default rounded-full px-2 py-0.5">
          {{ t('dash.google.ghostTag') }}
        </span>
      </div>
    </div>
  </UCard>

  <!-- STATE: trend — the "eerste weken"-design -->
  <UCard v-else :ui="{ body: '!p-0' }">
    <div class="grid lg:grid-cols-[5fr_6fr]">
      <div class="p-6 lg:border-r border-default">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-4">
          <svg class="size-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.6 6.6 0 0 1-9.85-3.47H2.18v2.85A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.86 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.68-2.85Z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.05L5.86 9.9A6.6 6.6 0 0 1 12 5.38Z" /></svg>
          {{ t('dash.google.eyebrow') }}
        </p>
        <div class="flex items-end gap-3">
          <span class="font-display text-6xl font-bold leading-none">{{ fmtRating(latest?.rating) }}</span>
          <div class="pb-1">
            <StarRating :size="16" :filled="Math.round(latest?.rating ?? 0)" readonly class="!justify-start" />
            <p class="text-sm mt-0.5">
              <strong>{{ latest?.review_count ?? '—' }}</strong> <span class="text-muted">{{ t('dash.google.reviewsOn') }}</span>
              <span v-if="countDelta > 0" class="text-green-700 font-semibold ml-1">↗ +{{ countDelta }}</span>
            </p>
          </div>
        </div>

        <hr class="border-dashed border-default my-4">

        <template v-if="countDelta > 0">
          <UBadge color="primary" variant="subtle" class="mb-2">↗ +{{ countDelta }} {{ t('dash.google.chipReviews') }}</UBadge>
          <p class="text-sm">
            <strong>{{ t('dash.google.newSince', { n: countDelta }, countDelta) }}</strong>
            {{ t('dash.google.sinceStart', { date: fmtDate(first?.captured_at) }) }}<template v-if="attribution"> — {{ attribution }}</template>
          </p>
        </template>
        <p v-else class="text-sm text-muted">{{ t('dash.google.noNewYet', { date: fmtDate(first?.captured_at) }) }}</p>

        <p class="text-xs text-muted mt-3 flex gap-1.5">
          <span class="text-dimmed shrink-0">—</span>
          <span v-if="ratingMoved">{{ t('dash.google.scoreUp', { a: fmtRating(first?.rating), b: fmtRating(latest?.rating) }) }}</span>
          <span v-else>{{ t('dash.google.scoreFlat', { a: fmtRating(first?.rating), b: fmtRating(latest?.rating), count: latest?.review_count ?? 0 }) }}</span>
        </p>
      </div>

      <div class="p-6">
        <div class="flex items-baseline justify-between mb-2">
          <h3 class="text-sm font-semibold">{{ t('dash.google.chartTitle') }}</h3>
          <span class="text-xs text-muted">{{ dateRange }}</span>
        </div>
        <DashboardScoreTrend :values="chartValues" />
        <div class="flex items-baseline justify-between mt-1 text-xs">
          <span class="text-muted">{{ fmtDate(first?.captured_at) }} · {{ first?.review_count ?? '—' }} {{ t('dash.google.reviewsShort') }}</span>
          <span class="font-semibold">{{ t('dash.google.now') }} · {{ latest?.review_count ?? '—' }} {{ t('dash.google.reviewsShort') }}</span>
        </div>
        <div class="flex items-baseline justify-between mt-3 pt-3 border-t border-default text-xs">
          <span class="text-muted">{{ t('dash.google.scoreLabel') }} <span class="text-dimmed mx-1">——</span> <strong class="text-default">{{ fmtRating(first?.rating) }} → {{ fmtRating(latest?.rating) }}</strong></span>
          <span v-if="!ratingMoved" class="text-muted">{{ t('dash.google.flatNote') }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
