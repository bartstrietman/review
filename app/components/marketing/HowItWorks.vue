<script setup lang="ts">
const { t } = useI18n()
const steps = computed(() => [
  { num: t('how.step1.num'), h: t('how.step1.h'), p: t('how.step1.p'), icon: 'i-lucide-code' },
  { num: t('how.step2.num'), h: t('how.step2.h'), p: t('how.step2.p'), icon: 'i-lucide-star' },
  { num: t('how.step3.num'), h: t('how.step3.h'), p: t('how.step3.p'), icon: 'i-lucide-route' },
])
</script>

<template>
  <section class="py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('how.eyebrow')" :title="t('how.h2')" :sub="t('how.sub')" />
      <div class="grid md:grid-cols-3 gap-8">
        <UCard v-for="step in steps" :key="step.num" variant="outline" class="rounded-2xl">
          <UIcon :name="step.icon" class="size-7 text-green-700" />
          <p class="mt-4 text-xs font-bold tracking-wider text-green-700">{{ step.num }}</p>
          <h3 class="mt-2 text-lg font-semibold">{{ step.h }}</h3>
          <p class="mt-2 text-sm text-muted">{{ step.p }}</p>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>
