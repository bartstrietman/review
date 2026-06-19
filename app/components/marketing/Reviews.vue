<script setup lang="ts">
import { TESTIMONIALS } from '~/data/marketing'

const { t } = useI18n()
</script>

<template>
  <section class="py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('testimonials.eyebrow')" :title="t('testimonials.h2')" />
      <div class="grid md:grid-cols-3 gap-6">
        <UCard v-for="item in TESTIMONIALS" :key="item.key" variant="outline" class="rounded-2xl">
          <StarRating :size="16" :filled="5" readonly class="!justify-start mb-3.5" />
          <p class="text-[15px] leading-relaxed mb-4">{{ t(`testimonials.${item.key}.text`) }}</p>
          <div class="flex items-center gap-2.5">
            <span class="size-9 rounded-full bg-elevated flex items-center justify-center text-[13px] font-semibold text-green-700">
              {{ item.initials }}
            </span>
            <span class="text-[13px] font-semibold text-muted">{{ t(`testimonials.${item.key}.biz`) }}</span>
          </div>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>
