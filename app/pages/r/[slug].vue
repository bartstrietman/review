<script setup lang="ts">
import type { Database, WidgetPublic } from '~/types/database.types'

definePageMeta({ layout: false })

const { t, locale } = useI18n()
const route = useRoute()
const supabase = useSupabaseClient<Database>()

const slug = computed(() => route.params.slug as string)

const { data: widget } = await useAsyncData(`widget-${slug.value}`, async () => {
  const { data } = await supabase.rpc('get_widget', { p_slug: slug.value })
  return (data?.[0] as WidgetPublic | undefined) ?? null
})

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', trustpilot: 'Trustpilot', tripadvisor: 'TripAdvisor',
  facebook: 'Facebook', overig: locale.value === 'nl' ? 'het reviewplatform' : 'the review platform',
}
const platformLabel = computed(() => PLATFORM_LABELS[widget.value?.review_platform ?? 'google'] ?? 'Google')

// Prefer the canonical Google "write a review" deep link built from the Place ID;
// fall back to whatever review URL was stored.
const reviewLink = computed(() => {
  const w = widget.value
  if (!w) return ''
  if (w.review_platform === 'google' && w.google_place_id) {
    return `https://search.google.com/local/writereview?placeid=${w.google_place_id}`
  }
  return w.google_url || ''
})

type Stage = 'rate' | 'review' | 'reviewPosted' | 'feedback' | 'feedbackThanks'
const stage = ref<Stage>('rate')
const rating = ref(0)
const message = ref('')
const reviewText = ref('')
const submitting = ref(false)
const copied = ref(false)

function choose(n: number) {
  rating.value = n
  stage.value = n >= 4 ? 'review' : 'feedback'
}

async function saveRow(text: string) {
  if (!widget.value) return
  await supabase.from('feedback').insert({
    customer_id: widget.value.customer_id,
    rating: rating.value,
    message: text || null,
  })
}

// Pre-select rating from the URL (?score=4 or ?rating=4) at render time so the
// correct state shows immediately (also in SSR), no flash of the star picker.
const scoreParam = Number(
  Array.isArray(route.query.score) ? route.query.score[0] : (route.query.score ?? route.query.rating),
)
if (widget.value && Number.isInteger(scoreParam) && scoreParam >= 1 && scoreParam <= 5) {
  choose(scoreParam)
}

// 1–3: private feedback
async function submitFeedback() {
  submitting.value = true
  await saveRow(message.value)
  submitting.value = false
  stage.value = 'feedbackThanks'
}

// 4–5: store the review, then offer copy + post on the platform
async function submitReview() {
  submitting.value = true
  await saveRow(reviewText.value)
  submitting.value = false
  stage.value = 'reviewPosted'
}

async function copyReview() {
  try {
    await navigator.clipboard.writeText(reviewText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* ignore */ }
}

// Per-business text overrides (fall back to the translated defaults).
const wt = computed(() => (widget.value?.widget_texts ?? {}) as Record<string, string>)
function txt(key: string, fallback: string) {
  const v = wt.value[key]
  return (typeof v === 'string' && v.trim()) ? v : fallback
}

const bg = computed(() => widget.value?.bg_color || '#0F3D2E')
const fg = computed(() => widget.value?.text_color || '#FFFFFF')

const { siteName } = useSite()
useHead({ title: () => widget.value ? `Review — ${widget.value.company_name}` : siteName.value })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4" :style="{ background: bg }">
    <div class="w-full max-w-md">
      <!-- not found -->
      <div v-if="!widget" class="rounded-2xl bg-white p-8 text-center">
        <UIcon name="i-lucide-search-x" class="size-10 text-muted mx-auto mb-3" />
        <p class="text-muted">{{ t('widget.notFound') }}</p>
      </div>

      <div v-else class="rounded-2xl bg-white p-7 sm:p-9 shadow-xl">
        <p class="text-center text-sm font-semibold text-muted mb-1">{{ widget.company_name }}</p>

        <!-- rate -->
        <template v-if="stage === 'rate'">
          <h1 class="text-center text-xl font-semibold mb-5">{{ txt('question', t('widget.question')) }}</h1>
          <StarRating :size="40" @rate="choose" />
          <p class="text-center text-xs text-muted mt-3">{{ t('widget.hint') }}</p>
        </template>

        <!-- 4-5: write the review (saved on our side) -->
        <template v-else-if="stage === 'review'">
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-party-popper" class="size-5 text-gold-500" />
            <h1 class="text-lg font-semibold">{{ txt('reviewTitle', t('widget.redirectTitle')) }}</h1>
          </div>
          <p class="text-sm text-muted mb-4">{{ t('widget.reviewSub') }}</p>
          <label class="block text-sm font-semibold mb-2">{{ txt('reviewPrompt', t('widget.reviewPrompt')) }}</label>
          <UTextarea v-model="reviewText" :rows="4" autoresize class="w-full mb-4" :placeholder="txt('reviewPlaceholder', t('widget.reviewPlaceholder'))" />
          <button
            class="block w-full rounded-lg px-5 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            :style="{ background: bg, color: fg }"
            :disabled="submitting || !reviewText.trim()"
            @click="submitReview"
          >
            {{ t('widget.reviewBtn') }}
          </button>
        </template>

        <!-- 4-5: saved → copy text + post on platform -->
        <div v-else-if="stage === 'reviewPosted'" class="text-center">
          <div class="size-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-check" class="size-6 text-green-700" />
          </div>
          <h1 class="font-semibold mb-1">{{ t('widget.postedTitle') }}</h1>
          <p class="text-sm text-muted mb-4">{{ t('widget.postedSub', { p: platformLabel }) }}</p>
          <div class="rounded-lg bg-elevated border border-default p-3 text-left text-sm mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap">{{ reviewText }}</div>
          <button
            class="block w-full rounded-lg border border-default px-5 py-2.5 font-semibold mb-2.5 hover:bg-elevated transition-colors flex items-center justify-center gap-2"
            @click="copyReview"
          >
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" />
            {{ copied ? t('widget.copied') : t('widget.copyBtn') }}
          </button>
          <a
            v-if="reviewLink"
            :href="reviewLink" target="_blank" rel="noopener"
            class="block w-full rounded-lg px-5 py-3 font-semibold transition-opacity hover:opacity-90"
            :style="{ background: bg, color: fg }"
          >
            {{ t('widget.postBtn') }} {{ platformLabel }}
          </a>
        </div>

        <!-- 1-3: private feedback with the business's custom prompt -->
        <template v-else-if="stage === 'feedback'">
          <h1 class="text-lg font-semibold mb-1">{{ txt('feedbackTitle', t('widget.feedbackTitle')) }}</h1>
          <p class="text-sm text-muted mb-4">{{ t('widget.feedbackSub') }}</p>
          <label class="block text-sm font-semibold mb-2">{{ txt('feedbackPrompt', widget.feedback_prompt) }}</label>
          <UTextarea v-model="message" :rows="4" autoresize class="w-full mb-4" :placeholder="txt('feedbackPlaceholder', t('widget.feedbackPlaceholder'))" />
          <button
            class="block w-full rounded-lg px-5 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            :style="{ background: bg, color: fg }"
            :disabled="submitting"
            @click="submitFeedback"
          >
            {{ t('widget.feedbackBtn') }}
          </button>
        </template>

        <div v-else class="text-center">
          <div class="size-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-check" class="size-6 text-green-700" />
          </div>
          <h1 class="font-semibold mb-1">{{ t('widget.feedbackThanksTitle') }}</h1>
          <p class="text-sm text-muted">{{ t('widget.feedbackThanksSub') }}</p>
        </div>
      </div>

      <p class="text-center text-xs mt-4 opacity-70" :style="{ color: fg }">{{ t('widget.poweredBy') }}</p>
    </div>
  </div>
</template>
