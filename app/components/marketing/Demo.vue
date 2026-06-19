<script setup lang="ts">
const { t } = useI18n()

type Stage = 'rate' | 'redirect' | 'thanks' | 'feedback' | 'feedbackthanks'
const stage = ref<Stage>('rate')
const rating = ref(0)
const feedbackText = ref('')

function onRate(n: number) {
  rating.value = n
  stage.value = n >= 4 ? 'redirect' : 'feedback'
}
function reset() {
  stage.value = 'rate'
  rating.value = 0
  feedbackText.value = ''
}
</script>

<template>
  <section id="demo" class="bg-green-700 py-20 sm:py-22 text-white scroll-mt-16">
    <UContainer>
      <MarketingSectionHead inverted :eyebrow="t('demo.eyebrow')" :title="t('demo.h2')" :sub="t('demo.sub')" />
      <div class="grid lg:grid-cols-2 gap-12 items-start">
        <div class="rounded-2xl border border-white/15 bg-white/5 p-6">
          <h4 class="text-sm font-semibold text-gold-400 mb-1.5">{{ t('demo.context.label') }}</h4>
          <p class="text-[15px] text-green-100/90 mb-4">{{ t('demo.context.p') }}</p>
          <div class="rounded-xl bg-white p-5 text-default">
            <p class="text-sm font-semibold text-muted">Kapsalon Anna</p>
            <p class="text-base font-semibold">{{ t('demo.context.thanks') }}</p>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 text-default min-h-56 flex flex-col justify-center">
          <template v-if="stage === 'rate'">
            <p class="text-sm text-muted mb-1.5 text-center">{{ t('demo.widget.q') }}</p>
            <StarRating :size="34" @rate="onRate" />
            <p class="text-center text-xs text-muted mt-1">{{ t('demo.widget.hint') }}</p>
          </template>

          <div v-else-if="stage === 'redirect'" class="text-center">
            <div class="size-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-lucide-star" class="size-6 text-gold-500" />
            </div>
            <p class="font-semibold mb-1.5">{{ t('demo.widget.redirect.title') }} ({{ rating }} ★)</p>
            <p class="text-[13px] text-muted mb-4">{{ t('demo.widget.redirect.sub') }}</p>
            <UButton color="primary" block @click="stage = 'thanks'">{{ t('demo.widget.redirect.btn') }}</UButton>
          </div>

          <div v-else-if="stage === 'thanks'" class="text-center py-5">
            <p class="font-semibold">{{ t('demo.widget.thanks') }}</p>
          </div>

          <template v-else-if="stage === 'feedback'">
            <p class="font-semibold mb-1">{{ t('demo.widget.feedback.title') }}</p>
            <p class="text-[13px] text-muted mb-3.5">{{ t('demo.widget.feedback.sub') }}</p>
            <UTextarea
              v-model="feedbackText" :rows="3" autoresize class="mb-3 w-full"
              :placeholder="t('demo.widget.feedback.placeholder')"
            />
            <UButton color="primary" block @click="stage = 'feedbackthanks'">{{ t('demo.widget.feedback.btn') }}</UButton>
          </template>

          <div v-else class="text-center">
            <div class="size-12 rounded-full bg-elevated flex items-center justify-center mx-auto mb-3.5">
              <UIcon name="i-lucide-check" class="size-6 text-green-700" />
            </div>
            <p class="font-semibold mb-1.5">{{ t('demo.widget.feedbackthanks.title') }}</p>
            <p class="text-[13px] text-muted">{{ t('demo.widget.feedbackthanks.sub') }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-7">
        <UButton variant="outline" color="neutral" class="!text-white !ring-white/30 hover:!bg-white/10" icon="i-lucide-rotate-ccw" @click="reset">
          {{ t('demo.reset') }}
        </UButton>
      </div>
    </UContainer>
  </section>
</template>
