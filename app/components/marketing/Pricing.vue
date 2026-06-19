<script setup lang="ts">
import { PRICING_PLANS } from '~/data/marketing'

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section id="pricing" class="bg-elevated py-20 sm:py-22 scroll-mt-16">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('pricing.eyebrow')" :title="t('pricing.h2')" :sub="t('pricing.sub')" />
      <div class="grid md:grid-cols-2 gap-7 max-w-3xl">
        <div
          v-for="plan in PRICING_PLANS" :key="plan.id"
          class="relative rounded-2xl border bg-white p-8"
          :class="plan.featured ? 'border-green-700' : 'border-default'"
        >
          <span
            v-if="plan.featured"
            class="absolute -top-3 left-8 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-green-900"
          >
            {{ t('pricing.popular') }}
          </span>
          <h3 class="text-xl font-semibold">{{ t(`pricing.${plan.id}.name`) }}</h3>
          <p class="text-sm text-muted mt-1.5 mb-5">{{ t(`pricing.${plan.id}.sub`) }}</p>
          <div class="font-display text-4xl font-bold flex items-baseline gap-1.5">
            {{ plan.price }}<span class="text-base font-medium text-muted">/ {{ t('pricing.permonth') }}</span>
          </div>
          <p class="text-[13px] text-green-700 font-semibold mt-1 mb-6">{{ t('pricing.trial') }}</p>
          <ul class="space-y-3 mb-7">
            <li v-for="fk in plan.featureKeys" :key="fk" class="flex gap-2.5 text-[15px]">
              <UIcon name="i-lucide-check" class="size-5 text-green-700 shrink-0 mt-0.5" />
              {{ t(`pricing.${plan.id}.${fk}`) }}
            </li>
          </ul>
          <UButton
            :to="localePath('/aanmelden') + `?pkg=${plan.id}`"
            block size="lg"
            :color="plan.featured ? 'primary' : 'neutral'"
            :variant="plan.featured ? 'solid' : 'soft'"
          >
            {{ t(`pricing.${plan.id}.cta`) }}
          </UButton>
        </div>
      </div>
    </UContainer>
  </section>
</template>
