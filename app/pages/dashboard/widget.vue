<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const origin = useRequestURL().origin
const { customer, refresh } = useMyBusiness()

const step = ref(route.query.step === '2' ? 2 : 1)

// ── Step 1: appearance & texts ──────────────────────────────
const form = reactive({
  bg_color: '#0F3D2E', text_color: '#FFFFFF', feedback_prompt: '',
  question: '', reviewTitle: '', reviewPrompt: '', reviewPlaceholder: '',
  feedbackTitle: '', feedbackPlaceholder: '',
})
watchEffect(() => {
  const c = customer.value
  if (!c) return
  const wt = (c.widget_texts ?? {}) as Record<string, string>
  Object.assign(form, {
    bg_color: c.bg_color ?? '#0F3D2E', text_color: c.text_color ?? '#FFFFFF', feedback_prompt: c.feedback_prompt ?? '',
    question: wt.question ?? '', reviewTitle: wt.reviewTitle ?? '', reviewPrompt: wt.reviewPrompt ?? '',
    reviewPlaceholder: wt.reviewPlaceholder ?? '', feedbackTitle: wt.feedbackTitle ?? '', feedbackPlaceholder: wt.feedbackPlaceholder ?? '',
  })
})

const def = computed(() => ({
  question: t('widget.question'), hint: t('widget.hint'),
  reviewTitle: t('widget.redirectTitle'), reviewSub: t('widget.reviewSub'),
  reviewPrompt: t('widget.reviewPrompt'), reviewPlaceholder: t('widget.reviewPlaceholder'), reviewBtn: t('widget.reviewBtn'),
  feedbackTitle: t('widget.feedbackTitle'), feedbackSub: t('widget.feedbackSub'),
  feedbackPrompt: 'Wat kunnen we verbeteren?', feedbackPlaceholder: t('widget.feedbackPlaceholder'), feedbackBtn: t('widget.feedbackBtn'),
}))

const previewTexts = computed(() => ({
  question: form.question.trim() || def.value.question, hint: def.value.hint,
  reviewTitle: form.reviewTitle.trim() || def.value.reviewTitle, reviewSub: def.value.reviewSub,
  reviewPrompt: form.reviewPrompt.trim() || def.value.reviewPrompt, reviewPlaceholder: form.reviewPlaceholder.trim() || def.value.reviewPlaceholder,
  reviewBtn: def.value.reviewBtn,
  feedbackTitle: form.feedbackTitle.trim() || def.value.feedbackTitle, feedbackSub: def.value.feedbackSub,
  feedbackPrompt: form.feedback_prompt.trim() || def.value.feedbackPrompt, feedbackPlaceholder: form.feedbackPlaceholder.trim() || def.value.feedbackPlaceholder,
  feedbackBtn: def.value.feedbackBtn,
}))

const previewStage = ref<'rate' | 'review' | 'feedback'>('rate')
const stageItems = computed(() => [
  { label: t('dash.widget.stRate'), value: 'rate' },
  { label: t('dash.widget.stPos'), value: 'review' },
  { label: t('dash.widget.stNeg'), value: 'feedback' },
])

const saving = ref(false)
async function save() {
  if (!customer.value) return
  saving.value = true
  const wt: Record<string, string> = {}
  for (const k of ['question', 'reviewTitle', 'reviewPrompt', 'reviewPlaceholder', 'feedbackTitle', 'feedbackPlaceholder'] as const) {
    const v = form[k].trim()
    if (v) wt[k] = v
  }
  const { error } = await supabase.from('customers').update({
    bg_color: form.bg_color, text_color: form.text_color,
    feedback_prompt: form.feedback_prompt || 'Wat kunnen we verbeteren?', widget_texts: wt,
  }).eq('id', customer.value.id)
  saving.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.widget.saved'), color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

async function saveAndNext() {
  await save()
  step.value = 2
}

// ── Step 2: install ─────────────────────────────────────────
const previewOpen = ref(false)
const reviewUrl = computed(() => customer.value ? `${origin}/r/${customer.value.slug}` : '')
const popupCode = computed(() => customer.value
  ? `<script src="${origin}/widget/${customer.value.slug}.js" data-mode="popup"><\/script>` : '')
const embedCode = computed(() => customer.value
  ? `<div id="rs-embed-${customer.value.slug}"></div>\n<script src="${origin}/widget/${customer.value.slug}.js" data-mode="embed" data-target="rs-embed-${customer.value.slug}"><\/script>` : '')

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.add({ title: 'Gekopieerd', color: 'success', icon: 'i-lucide-check' }) }
  catch { toast.add({ title: 'Kon niet kopiëren', color: 'error' }) }
}

const steps = computed(() => [
  { h: t('dash.install.s1'), p: t('dash.install.s1d') },
  { h: t('dash.install.s2'), p: t('dash.install.s2d') },
  { h: t('dash.install.s3'), p: t('dash.install.s3d') },
])

usePageTitle('Widget')
</script>

<template>
  <UDashboardPanel id="dash-widget">
    <template #header>
      <UDashboardNavbar :title="t('dash.widget.nav')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton v-if="step === 1" color="primary" icon="i-lucide-save" :loading="saving" @click="save">{{ t('dash.widget.save') }}</UButton>
          <UserMenu />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- step indicator -->
      <div class="flex items-center gap-2 mb-6 text-sm font-semibold">
        <button
          type="button" class="flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-colors"
          :class="step === 1 ? 'bg-green-700 border-green-700 text-white' : 'bg-accented border-default text-muted hover:text-highlighted hover:border-green-700/40'"
          @click="step = 1"
        >
          <span class="size-5 rounded-full flex items-center justify-center text-xs" :class="step === 1 ? 'bg-white/25 text-white' : 'bg-default text-dimmed'">1</span>{{ t('dash.widget.step1') }}
        </button>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
        <button
          type="button" class="flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-colors"
          :class="step === 2 ? 'bg-green-700 border-green-700 text-white' : 'bg-accented border-default text-muted hover:text-highlighted hover:border-green-700/40'"
          @click="step = 2"
        >
          <span class="size-5 rounded-full flex items-center justify-center text-xs" :class="step === 2 ? 'bg-white/25 text-white' : 'bg-default text-dimmed'">2</span>{{ t('dash.widget.step2') }}
        </button>
      </div>

      <!-- ════ STEP 1: set up ════ -->
      <div v-if="step === 1">
        <p class="text-muted mb-6 max-w-2xl">{{ t('dash.widget.intro') }}</p>
        <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div class="space-y-6">
            <UCard>
              <template #header><h2 class="font-semibold">{{ t('dash.widget.colors') }}</h2></template>
              <div class="grid sm:grid-cols-2 gap-4">
                <UFormField :label="t('dash.widget.bg')">
                  <div class="flex items-center gap-2">
                    <span class="size-8 rounded-md border border-default shrink-0" :style="{ background: form.bg_color }" />
                    <UInput v-model="form.bg_color" class="w-full" />
                  </div>
                </UFormField>
                <UFormField :label="t('dash.widget.text')">
                  <div class="flex items-center gap-2">
                    <span class="size-8 rounded-md border border-default shrink-0" :style="{ background: form.text_color }" />
                    <UInput v-model="form.text_color" class="w-full" />
                  </div>
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header><h2 class="font-semibold">{{ t('dash.widget.secRate') }}</h2></template>
              <UFormField :label="t('dash.widget.question')" :help="t('dash.widget.leaveEmpty')">
                <UInput v-model="form.question" class="w-full" :placeholder="def.question" @focus="previewStage = 'rate'" />
              </UFormField>
            </UCard>

            <UCard>
              <template #header><h2 class="font-semibold">{{ t('dash.widget.secPos') }}</h2></template>
              <div class="space-y-4">
                <UFormField :label="t('dash.widget.reviewTitle')">
                  <UInput v-model="form.reviewTitle" class="w-full" :placeholder="def.reviewTitle" @focus="previewStage = 'review'" />
                </UFormField>
                <UFormField :label="t('dash.widget.reviewPrompt')">
                  <UInput v-model="form.reviewPrompt" class="w-full" :placeholder="def.reviewPrompt" @focus="previewStage = 'review'" />
                </UFormField>
                <UFormField :label="t('dash.widget.reviewPlaceholder')">
                  <UInput v-model="form.reviewPlaceholder" class="w-full" :placeholder="def.reviewPlaceholder" @focus="previewStage = 'review'" />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header><h2 class="font-semibold">{{ t('dash.widget.secNeg') }}</h2></template>
              <div class="space-y-4">
                <UFormField :label="t('dash.widget.feedbackTitle')">
                  <UInput v-model="form.feedbackTitle" class="w-full" :placeholder="def.feedbackTitle" @focus="previewStage = 'feedback'" />
                </UFormField>
                <UFormField :label="t('dash.widget.feedbackPrompt')">
                  <UInput v-model="form.feedback_prompt" class="w-full" :placeholder="def.feedbackPrompt" @focus="previewStage = 'feedback'" />
                </UFormField>
                <UFormField :label="t('dash.widget.feedbackPlaceholder')">
                  <UInput v-model="form.feedbackPlaceholder" class="w-full" :placeholder="def.feedbackPlaceholder" @focus="previewStage = 'feedback'" />
                </UFormField>
              </div>
            </UCard>

            <div class="flex justify-end">
              <UButton color="primary" size="lg" trailing-icon="i-lucide-arrow-right" :loading="saving" @click="saveAndNext">
                {{ t('dash.widget.next') }}
              </UButton>
            </div>
          </div>

          <div class="lg:sticky lg:top-4">
            <p class="text-sm font-semibold mb-2">{{ t('dash.widget.preview') }}</p>
            <UTabs v-model="previewStage" :items="stageItems" size="sm" class="mb-3" />
            <WidgetPreview
              :bg="form.bg_color" :fg="form.text_color"
              :company="customer?.company_name || ''" :stage="previewStage" :texts="previewTexts"
            />
          </div>
        </div>
      </div>

      <!-- ════ STEP 2: install ════ -->
      <div v-else class="max-w-3xl space-y-6">
        <p class="text-muted">{{ t('dash.install.intro') }}</p>

        <!-- live popup preview -->
        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.install.previewTitle') }}</h2></template>
          <div class="grid md:grid-cols-[1fr_auto] gap-5 items-start">
            <div>
              <p class="text-sm text-muted mb-3">{{ t('dash.install.previewD') }}</p>
              <div class="relative h-[480px] rounded-xl border border-default bg-white overflow-hidden">
                <div class="p-5">
                  <div class="flex items-center gap-1.5 mb-4">
                    <span class="size-2 rounded-full bg-sand-200" /><span class="size-2 rounded-full bg-sand-200" /><span class="size-2 rounded-full bg-sand-200" />
                    <span class="ml-2 h-4 flex-1 max-w-48 rounded bg-elevated" />
                  </div>
                  <p class="font-semibold">{{ t('dash.install.mockTitle') }}</p>
                  <p class="text-sm text-muted">{{ t('dash.install.mockSub') }}</p>
                  <div class="mt-4 space-y-2"><div class="h-2.5 w-3/4 rounded bg-elevated" /><div class="h-2.5 w-1/2 rounded bg-elevated" /></div>
                </div>
                <button
                  v-if="!previewOpen" type="button"
                  class="absolute bottom-4 right-4 rounded-full bg-green-700 text-white text-sm font-semibold px-4 py-2.5 shadow-lg hover:bg-green-600 transition-colors"
                  @click="previewOpen = true"
                >{{ t('dash.install.launcher') }}</button>
                <span v-if="!previewOpen" class="absolute bottom-16 right-4 text-xs text-muted">{{ t('dash.install.tryIt') }}</span>
                <div v-else class="absolute inset-0 bg-black/45 flex items-center justify-center p-4">
                  <div class="relative w-full max-w-[320px]">
                    <button type="button" aria-label="Sluiten" class="absolute -top-8 right-0 text-white text-2xl leading-none" @click="previewOpen = false">&times;</button>
                    <iframe :src="`/r/${customer?.slug}`" title="Review-voorbeeld" class="w-full rounded-2xl border-0 bg-white" style="height:400px" />
                  </div>
                </div>
              </div>
            </div>
            <div class="md:w-56">
              <h3 class="font-semibold text-sm mb-2">{{ t('dash.install.howTitle') }}</h3>
              <ol class="space-y-2.5">
                <li v-for="(s, i) in [t('dash.install.how1'), t('dash.install.how2'), t('dash.install.how3')]" :key="i" class="flex gap-2.5 text-sm">
                  <span class="size-5 shrink-0 rounded-full bg-green-700 text-white text-[11px] flex items-center justify-center font-bold">{{ i + 1 }}</span>
                  <span class="text-muted">{{ s }}</span>
                </li>
              </ol>
            </div>
          </div>
        </UCard>

        <!-- popup code -->
        <UCard>
          <div class="flex items-center gap-2 mb-1.5"><UBadge color="primary" variant="subtle">Optie 1</UBadge><h2 class="font-semibold">{{ t('dash.install.popup') }}</h2></div>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.popupD') }}</p>
          <div class="relative">
            <pre class="overflow-x-auto rounded-lg bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ popupCode }}</code></pre>
            <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" icon="i-lucide-copy" aria-label="Kopieer" @click="copy(popupCode)" />
          </div>
        </UCard>

        <!-- embed code -->
        <UCard>
          <div class="flex items-center gap-2 mb-1.5"><UBadge color="primary" variant="subtle">Optie 2</UBadge><h2 class="font-semibold">{{ t('dash.install.embed') }}</h2></div>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.embedD') }}</p>
          <div class="relative">
            <pre class="overflow-x-auto rounded-lg bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ embedCode }}</code></pre>
            <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" icon="i-lucide-copy" aria-label="Kopieer" @click="copy(embedCode)" />
          </div>
        </UCard>

        <!-- direct link + QR -->
        <UCard>
          <h2 class="font-semibold mb-1">{{ t('dash.install.noSite') }}</h2>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.noSiteD') }}</p>
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <QrCode :value="reviewUrl" :size="140" />
            <div class="flex-1 w-full">
              <div class="flex gap-2">
                <UInput :model-value="reviewUrl" readonly class="flex-1 font-mono text-xs" :aria-label="t('dash.link.label')" />
                <UButton icon="i-lucide-copy" color="primary" :aria-label="t('dash.link.copy')" @click="copy(reviewUrl)" />
                <UButton :to="`/r/${customer?.slug}`" target="_blank" icon="i-lucide-external-link" color="neutral" variant="soft" :aria-label="t('dash.reviewPage')" />
              </div>
              <p class="text-xs text-muted mt-2">{{ t('dash.install.scan') }}</p>
            </div>
          </div>
        </UCard>

        <!-- steps -->
        <div>
          <h2 class="font-semibold mb-3">{{ t('dash.install.steps') }}</h2>
          <div class="space-y-3">
            <div v-for="(s, i) in steps" :key="i" class="flex gap-4 rounded-xl border border-default bg-white p-5">
              <span class="size-8 shrink-0 rounded-full bg-green-700 text-white flex items-center justify-center font-display font-bold text-sm">{{ i + 1 }}</span>
              <div><h3 class="font-semibold text-sm">{{ s.h }}</h3><p class="text-sm text-muted mt-1">{{ s.p }}</p></div>
            </div>
          </div>
        </div>

        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" @click="step = 1">{{ t('dash.widget.back') }}</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
