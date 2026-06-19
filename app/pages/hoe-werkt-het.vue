<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const steps = computed(() => [
  { h: t('howpage.s1.h'), p: t('howpage.s1.p') },
  { h: t('howpage.s2.h'), p: t('howpage.s2.p') },
  { h: t('howpage.s3.h'), p: t('howpage.s3.p') },
  { h: t('howpage.s4.h'), p: t('howpage.s4.p') },
  { h: t('howpage.s5.h'), p: t('howpage.s5.p') },
])

useSeoMeta({ title: () => `${t('howpage.h1')} — ReviewShield` })
</script>

<template>
  <UContainer class="py-16 sm:py-20 max-w-3xl">
    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
      <span class="size-1.5 rounded-full bg-gold-400" />{{ t('howpage.eyebrow') }}
    </p>
    <h1 class="mt-3.5 text-4xl font-bold tracking-tight">{{ t('howpage.h1') }}</h1>
    <p class="mt-3 text-lg text-muted">{{ t('howpage.sub') }}</p>

    <div class="mt-12 space-y-5">
      <div v-for="(step, i) in steps" :key="i" class="flex gap-5 rounded-2xl border border-default bg-white p-6">
        <span class="size-9 shrink-0 rounded-full bg-green-700 text-white flex items-center justify-center font-display font-bold">
          {{ i + 1 }}
        </span>
        <div>
          <h3 class="text-lg font-semibold">{{ step.h }}</h3>
          <p class="mt-1.5 text-[15px] text-muted leading-relaxed">{{ step.p }}</p>
        </div>
      </div>
    </div>

    <div class="mt-10 flex flex-wrap gap-3">
      <UButton :to="localePath('/aanmelden')" color="primary" size="lg" trailing-icon="i-lucide-arrow-right">
        {{ t('hero.cta') }}
      </UButton>
      <UButton :to="localePath('/faq')" color="neutral" variant="outline" size="lg">{{ t('conf.faqbtn') }}</UButton>
    </div>
  </UContainer>
</template>
