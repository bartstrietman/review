<script setup lang="ts">
const { t, locale } = useI18n()

const klanten = ref(40)
const waarde = ref(150)
const score = ref(4.1)

const pct = computed(() => Math.min(0.18, Math.max(0, 4.7 - score.value) * 0.12))
const extra = computed(() => Math.round(klanten.value * pct.value * waarde.value))

const scoreOut = computed(() => score.value.toFixed(1).replace('.', locale.value === 'nl' ? ',' : '.'))
const extraOut = computed(() => '€' + extra.value.toLocaleString('nl-NL'))

const explainer = computed(() => {
  if (extra.value <= 0) return t('roi.explainer.maxed')
  const p = Math.round(pct.value * 100)
  return locale.value === 'nl'
    ? `Bij een verbetering richting 4,5+ sterren is een toename van ~${p}% in aanvragen realistisch. Dit is een indicatie, geen garantie.`
    : `With an improvement towards 4.5+ stars, an increase of ~${p}% in inquiries is realistic. This is an estimate, not a guarantee.`
})
</script>

<template>
  <section class="bg-elevated py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('roi.eyebrow')" :title="t('roi.h2')" :sub="t('roi.sub')" />
      <div class="grid md:grid-cols-2 gap-10 rounded-2xl border border-default bg-white p-8">
        <div class="space-y-6">
          <div>
            <label class="block text-[13px] font-semibold mb-2">{{ t('roi.klanten.lbl') }}</label>
            <USlider v-model="klanten" :min="5" :max="300" :step="5" />
            <div class="flex justify-between text-sm text-muted mt-1.5">
              <span>{{ t('roi.klanten.unit') }}</span><strong class="text-default">{{ klanten }}</strong>
            </div>
          </div>
          <div>
            <label class="block text-[13px] font-semibold mb-2">{{ t('roi.waarde.lbl') }}</label>
            <USlider v-model="waarde" :min="10" :max="2000" :step="10" />
            <div class="flex justify-between text-sm text-muted mt-1.5">
              <span>{{ t('roi.waarde.unit') }}</span><strong class="text-default">€{{ waarde }}</strong>
            </div>
          </div>
          <div>
            <label class="block text-[13px] font-semibold mb-2">{{ t('roi.score.lbl') }}</label>
            <USlider v-model="score" :min="2.5" :max="4.7" :step="0.1" />
            <div class="flex justify-between text-sm text-muted mt-1.5">
              <span>{{ t('roi.score.unit') }}</span><strong class="text-default">{{ scoreOut }}</strong>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-green-700 text-white p-6 flex flex-col justify-center">
          <p class="text-[13px] text-green-100/80 mb-1">{{ t('roi.result.lbl') }}</p>
          <p class="font-display text-4xl font-bold text-gold-400 mb-4">{{ extraOut }}</p>
          <div class="border-t border-white/15 my-2" />
          <p class="text-[13px] text-green-100/80 leading-relaxed">{{ explainer }}</p>
        </div>
      </div>
    </UContainer>
  </section>
</template>
