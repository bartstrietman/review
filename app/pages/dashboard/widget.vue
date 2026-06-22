<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { customer, refresh } = useMyBusiness()

// Editable state: colors + feedback prompt (column) + text overrides (jsonb).
const form = reactive({
  bg_color: '#0F3D2E',
  text_color: '#FFFFFF',
  feedback_prompt: '',
  question: '',
  reviewTitle: '',
  reviewPrompt: '',
  reviewPlaceholder: '',
  feedbackTitle: '',
  feedbackPlaceholder: '',
})

watchEffect(() => {
  const c = customer.value
  if (!c) return
  const wt = (c.widget_texts ?? {}) as Record<string, string>
  Object.assign(form, {
    bg_color: c.bg_color ?? '#0F3D2E',
    text_color: c.text_color ?? '#FFFFFF',
    feedback_prompt: c.feedback_prompt ?? '',
    question: wt.question ?? '',
    reviewTitle: wt.reviewTitle ?? '',
    reviewPrompt: wt.reviewPrompt ?? '',
    reviewPlaceholder: wt.reviewPlaceholder ?? '',
    feedbackTitle: wt.feedbackTitle ?? '',
    feedbackPlaceholder: wt.feedbackPlaceholder ?? '',
  })
})

// Defaults (also used as input placeholders + preview fallback).
const def = computed(() => ({
  question: t('widget.question'),
  hint: t('widget.hint'),
  reviewTitle: t('widget.redirectTitle'),
  reviewSub: t('widget.reviewSub'),
  reviewPrompt: t('widget.reviewPrompt'),
  reviewPlaceholder: t('widget.reviewPlaceholder'),
  reviewBtn: t('widget.reviewBtn'),
  feedbackTitle: t('widget.feedbackTitle'),
  feedbackSub: t('widget.feedbackSub'),
  feedbackPrompt: 'Wat kunnen we verbeteren?',
  feedbackPlaceholder: t('widget.feedbackPlaceholder'),
  feedbackBtn: t('widget.feedbackBtn'),
}))

const previewTexts = computed(() => ({
  question: form.question.trim() || def.value.question,
  hint: def.value.hint,
  reviewTitle: form.reviewTitle.trim() || def.value.reviewTitle,
  reviewSub: def.value.reviewSub,
  reviewPrompt: form.reviewPrompt.trim() || def.value.reviewPrompt,
  reviewPlaceholder: form.reviewPlaceholder.trim() || def.value.reviewPlaceholder,
  reviewBtn: def.value.reviewBtn,
  feedbackTitle: form.feedbackTitle.trim() || def.value.feedbackTitle,
  feedbackSub: def.value.feedbackSub,
  feedbackPrompt: form.feedback_prompt.trim() || def.value.feedbackPrompt,
  feedbackPlaceholder: form.feedbackPlaceholder.trim() || def.value.feedbackPlaceholder,
  feedbackBtn: def.value.feedbackBtn,
}))

const stage = ref<'rate' | 'review' | 'feedback'>('rate')
const stageItems = computed(() => [
  { label: t('dash.widget.stRate'), value: 'rate' },
  { label: t('dash.widget.stPos'), value: 'review' },
  { label: t('dash.widget.stNeg'), value: 'feedback' },
])

const saving = ref(false)
async function save() {
  if (!customer.value) return
  saving.value = true
  // Only store non-empty overrides in widget_texts.
  const wt: Record<string, string> = {}
  for (const k of ['question', 'reviewTitle', 'reviewPrompt', 'reviewPlaceholder', 'feedbackTitle', 'feedbackPlaceholder'] as const) {
    const v = form[k].trim()
    if (v) wt[k] = v
  }
  const { error } = await supabase.from('customers').update({
    bg_color: form.bg_color,
    text_color: form.text_color,
    feedback_prompt: form.feedback_prompt || 'Wat kunnen we verbeteren?',
    widget_texts: wt,
  }).eq('id', customer.value.id)
  saving.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.widget.saved'), color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

useSeoMeta({ title: 'Widget — ReviewShield' })
</script>

<template>
  <UDashboardPanel id="dash-widget">
    <template #header>
      <UDashboardNavbar :title="t('dash.widget.nav')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton color="primary" icon="i-lucide-save" :loading="saving" @click="save">{{ t('dash.widget.save') }}</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted mb-6 max-w-2xl">{{ t('dash.widget.intro') }}</p>

      <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <!-- form -->
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
              <UInput v-model="form.question" class="w-full" :placeholder="def.question" @focus="stage = 'rate'" />
            </UFormField>
          </UCard>

          <UCard>
            <template #header><h2 class="font-semibold">{{ t('dash.widget.secPos') }}</h2></template>
            <div class="space-y-4">
              <UFormField :label="t('dash.widget.reviewTitle')">
                <UInput v-model="form.reviewTitle" class="w-full" :placeholder="def.reviewTitle" @focus="stage = 'review'" />
              </UFormField>
              <UFormField :label="t('dash.widget.reviewPrompt')">
                <UInput v-model="form.reviewPrompt" class="w-full" :placeholder="def.reviewPrompt" @focus="stage = 'review'" />
              </UFormField>
              <UFormField :label="t('dash.widget.reviewPlaceholder')">
                <UInput v-model="form.reviewPlaceholder" class="w-full" :placeholder="def.reviewPlaceholder" @focus="stage = 'review'" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header><h2 class="font-semibold">{{ t('dash.widget.secNeg') }}</h2></template>
            <div class="space-y-4">
              <UFormField :label="t('dash.widget.feedbackTitle')">
                <UInput v-model="form.feedbackTitle" class="w-full" :placeholder="def.feedbackTitle" @focus="stage = 'feedback'" />
              </UFormField>
              <UFormField :label="t('dash.widget.feedbackPrompt')">
                <UInput v-model="form.feedback_prompt" class="w-full" :placeholder="def.feedbackPrompt" @focus="stage = 'feedback'" />
              </UFormField>
              <UFormField :label="t('dash.widget.feedbackPlaceholder')">
                <UInput v-model="form.feedbackPlaceholder" class="w-full" :placeholder="def.feedbackPlaceholder" @focus="stage = 'feedback'" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <!-- live preview -->
        <div class="lg:sticky lg:top-4">
          <p class="text-sm font-semibold mb-2">{{ t('dash.widget.preview') }}</p>
          <UTabs v-model="stage" :items="stageItems" size="sm" class="mb-3" />
          <WidgetPreview
            :bg="form.bg_color" :fg="form.text_color"
            :company="customer?.company_name || ''" :stage="stage" :texts="previewTexts"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
