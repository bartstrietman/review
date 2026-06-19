<script setup lang="ts">
import { BRANCHES_DATA } from '~/data/branches'

const { t, locale } = useI18n()
const data = computed(() => BRANCHES_DATA[locale.value as 'nl' | 'en'] ?? BRANCHES_DATA.nl)
const active = ref(0)
watch(locale, () => { active.value = 0 })
const branch = computed(() => data.value[active.value])
</script>

<template>
  <section class="border-y border-default bg-white py-20 sm:py-22">
    <UContainer>
      <MarketingSectionHead :eyebrow="t('branches.eyebrow')" :title="t('branches.h2')" :sub="t('branches.sub')" />
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="(b, i) in data" :key="b.label"
          type="button"
          class="rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors"
          :class="i === active
            ? 'bg-green-700 text-white border-green-700'
            : 'bg-white text-muted border-default hover:border-green-500 hover:text-highlighted'"
          @click="active = i"
        >
          {{ b.label }}
        </button>
      </div>

      <div v-if="branch" class="grid md:grid-cols-2 gap-8 rounded-2xl border border-default bg-white p-8">
        <div>
          <h3 class="text-xl font-semibold">{{ branch.title }}</h3>
          <p class="mt-2.5 text-[15px] text-muted leading-relaxed">{{ branch.scenario }}</p>
          <div class="flex gap-5 mt-4">
            <div v-for="s in [branch.stat1, branch.stat2]" :key="s.lbl">
              <div class="font-display text-2xl font-bold text-green-600">{{ s.num }}</div>
              <div class="text-xs text-muted mt-0.5">{{ s.lbl }}</div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <span
              v-for="sector in branch.sectors" :key="sector"
              class="rounded-full bg-elevated px-3 py-1.5 text-xs font-semibold text-green-700"
            >
              {{ sector }}
            </span>
          </div>
        </div>
        <div class="rounded-xl bg-elevated p-5 text-sm italic text-default leading-relaxed self-start">
          {{ branch.quote }}
        </div>
      </div>
    </UContainer>
  </section>
</template>
