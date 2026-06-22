<script setup lang="ts">
const { t } = useI18n()
const cards = computed(() => [
  { h: t('privacy.1.h'), p: t('privacy.1.p'), icon: 'i-lucide-shield-check' },
  { h: t('privacy.2.h'), p: t('privacy.2.p'), icon: 'i-lucide-lock' },
  { h: t('privacy.3.h'), p: t('privacy.3.p'), icon: 'i-lucide-credit-card' },
])
</script>

<template>
  <section class="py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('privacy.eyebrow')" :title="t('privacy.h2')" :sub="t('privacy.sub')" />
      <div class="grid md:grid-cols-3 gap-6">
        <UCard v-for="c in cards" :key="c.h" variant="outline" class="rounded-2xl">
          <div class="size-10 rounded-lg bg-elevated flex items-center justify-center mb-3.5">
            <UIcon :name="c.icon" class="size-5 text-green-700" />
          </div>
          <h3 class="text-base font-semibold mb-2">{{ c.h }}</h3>
          <p class="text-sm text-muted leading-relaxed">{{ c.p }}</p>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>
