<script setup lang="ts">
const { t } = useI18n()
const stats = computed(() => [
  { num: '97%', suffix: '', desc: t('urgency.stat1') },
  { num: '68%', suffix: '', desc: t('urgency.stat2') },
  { num: '14', suffix: ' ' + t('urgency.days'), desc: t('urgency.stat3') },
])
</script>

<template>
  <section class="bg-green-700 py-20 sm:py-22 text-white">
    <UContainer>
      <MarketingSectionHead inverted :eyebrow="t('urgency.eyebrow')" :title="t('urgency.h2')" :sub="t('urgency.sub')" />
      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="s in stats" :key="s.desc" class="rounded-2xl border border-white/15 bg-white/5 p-6">
          <div class="font-display text-3xl font-bold text-gold-400 mb-2">{{ s.num }}<span class="text-xl">{{ s.suffix }}</span></div>
          <p class="text-sm text-green-100/90 leading-relaxed">{{ s.desc }}</p>
        </div>
      </div>
      <p class="mt-8 text-xs text-green-100/60">{{ t('urgency.source') }}</p>
    </UContainer>
  </section>
</template>
