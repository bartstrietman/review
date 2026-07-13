<script setup lang="ts">
const { t } = useI18n()
const { siteName } = useSite()

interface Cell { text?: string; mark?: 'check' | 'x' }
const rows = computed<{ lbl: string; us: Cell; c2: Cell; c3: Cell }[]>(() => [
  {
    lbl: t('compare.row1.lbl'),
    us: { text: '€19,99' },
    c2: { text: '€75 – €400+' },
    c3: { text: t('compare.row1.c3') },
  },
  {
    lbl: t('compare.row2.lbl'),
    us: { text: t('compare.row2.us') },
    c2: { text: t('compare.row2.c2') },
    c3: { text: t('compare.row2.c3') },
  },
  {
    lbl: t('compare.row3.lbl'),
    us: { text: t('compare.auto'), mark: 'check' },
    c2: { mark: 'check' },
    c3: { text: t('compare.manual'), mark: 'x' },
  },
  {
    lbl: t('compare.row4.lbl'),
    us: { mark: 'check' },
    c2: { text: t('compare.tooexp'), mark: 'x' },
    c3: { mark: 'check' },
  },
  {
    lbl: t('compare.row5.lbl'),
    us: { text: t('compare.none') },
    c2: { text: t('compare.yearly') },
    c3: { text: 'N.v.t.' },
  },
])
</script>

<template>
  <section class="border-y border-default bg-white py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('compare.eyebrow')" :title="t('compare.h2')" :sub="t('compare.sub')" />
      <div class="overflow-hidden rounded-2xl border border-default bg-white">
        <div class="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-elevated text-[13px] font-semibold">
          <div class="px-4 py-4" />
          <div class="px-4 py-4 text-green-700">{{ siteName }}</div>
          <div class="px-4 py-4 text-muted">{{ t('compare.col2') }}</div>
          <div class="px-4 py-4 text-muted">{{ t('compare.col3') }}</div>
        </div>
        <div
          v-for="(row, i) in rows" :key="row.lbl"
          class="grid grid-cols-[1.4fr_1fr_1fr_1fr] text-sm"
          :class="i < rows.length - 1 ? 'border-b border-default' : ''"
        >
          <div class="px-4 py-4 font-medium text-muted flex items-center">{{ row.lbl }}</div>
          <div class="px-4 py-4 flex items-center gap-1.5 bg-gold-400/8 font-semibold text-green-700">
            <UIcon v-if="row.us.mark === 'check'" name="i-lucide-check" class="size-4 text-green-700 shrink-0" />
            <UIcon v-else-if="row.us.mark === 'x'" name="i-lucide-x" class="size-4 text-muted shrink-0" />
            <span>{{ row.us.text }}</span>
          </div>
          <div class="px-4 py-4 flex items-center gap-1.5">
            <UIcon v-if="row.c2.mark === 'check'" name="i-lucide-check" class="size-4 text-green-700 shrink-0" />
            <UIcon v-else-if="row.c2.mark === 'x'" name="i-lucide-x" class="size-4 text-muted shrink-0" />
            <span>{{ row.c2.text }}</span>
          </div>
          <div class="px-4 py-4 flex items-center gap-1.5">
            <UIcon v-if="row.c3.mark === 'check'" name="i-lucide-check" class="size-4 text-green-700 shrink-0" />
            <UIcon v-else-if="row.c3.mark === 'x'" name="i-lucide-x" class="size-4 text-muted shrink-0" />
            <span>{{ row.c3.text }}</span>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
