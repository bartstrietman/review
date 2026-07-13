<script setup lang="ts">
import { PRICING_PLAN } from '~/data/marketing'

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section id="pricing" class="py-20 sm:py-22 scroll-mt-16">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('pricing.eyebrow')" :title="t('pricing.h2')" :sub="t('pricing.sub')" />
      <div class="max-w-md mx-auto">
        <div class="rounded-2xl border border-green-700 bg-white p-8 shadow-sm">
          <h3 class="text-xl font-semibold">{{ t('pricing.plan.name') }}</h3>
          <p class="text-sm text-muted mt-1.5 mb-5">{{ t('pricing.plan.sub') }}</p>
          <div class="font-display text-4xl font-bold flex items-baseline gap-1.5">
            {{ PRICING_PLAN.price }}<span class="text-base font-medium text-muted">/ {{ t('pricing.permonth') }}</span>
          </div>
          <p class="text-[13px] text-green-700 font-semibold mt-1 mb-6">{{ t('pricing.trial') }}</p>
          <ul class="space-y-3 mb-7">
            <li v-for="fk in PRICING_PLAN.featureKeys" :key="fk" class="flex gap-2.5 text-[15px]">
              <UIcon name="i-lucide-check" class="size-5 text-green-700 shrink-0 mt-0.5" />
              {{ t(`pricing.plan.${fk}`) }}
            </li>
          </ul>
          <UButton :to="localePath('/aanmelden')" block size="lg" color="primary">
            {{ t('pricing.plan.cta') }}
          </UButton>
        </div>
      </div>
    </UContainer>
  </section>
</template>
