<script setup lang="ts">
import { FAQ_DATA } from '~/data/faq'

const { t, locale } = useI18n()
const items = computed(() =>
  (FAQ_DATA[locale.value as 'nl' | 'en'] ?? FAQ_DATA.nl).map(f => ({ label: f.q, content: f.a })),
)

usePageTitle(() => t('faqpage.h1'))
</script>

<template>
  <UContainer class="py-16 sm:py-20 max-w-3xl">
    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
      <span class="size-1.5 rounded-full bg-gold-400" />{{ t('faqpage.eyebrow') }}
    </p>
    <h1 class="mt-3.5 text-4xl font-bold tracking-tight">{{ t('faqpage.h1') }}</h1>
    <p class="mt-3 text-lg text-muted">{{ t('faqpage.sub') }}</p>

    <UAccordion :items="items" class="mt-10" :ui="{ item: 'border-b border-default' }" />
  </UContainer>
</template>
