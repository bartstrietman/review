<script setup lang="ts">
import { WIDGET_STYLES } from '~/data/marketing'

const { t, locale } = useI18n()
</script>

<template>
  <section class="py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('examples.eyebrow')" :title="t('examples.h2')" :sub="t('examples.sub')" />
      <div class="grid sm:grid-cols-3 gap-6">
        <div
          v-for="s in WIDGET_STYLES" :key="s.biz.nl"
          class="overflow-hidden rounded-2xl border border-default"
        >
          <div class="bg-elevated px-4 py-3 text-xs font-semibold text-muted">
            {{ s.biz[locale as 'nl' | 'en'] }}
          </div>
          <div class="flex flex-col items-center gap-2.5 px-4 py-6" :style="{ background: s.bg }">
            <p class="text-sm font-semibold" :style="{ color: s.fg }">{{ t('examples.preview.q') }}</p>
            <StarRating :size="22" :filled="4" readonly />
            <p
              class="text-[11px]"
              :style="{ color: s.fg === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : '#5C5C54' }"
            >
              {{ t('demo.widget.hint') }}
            </p>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
