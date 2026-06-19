<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const rated = ref(0)
</script>

<template>
  <section class="border-b border-default py-16 sm:py-20">
    <UContainer>
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
        <div>
          <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
            <span class="size-1.5 rounded-full bg-gold-400" />
            {{ t('hero.eyebrow') }}
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <h1 class="mt-4 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight" v-html="t('hero.h1')" />
          <p class="mt-5 text-lg text-muted max-w-md">{{ t('hero.lede') }}</p>
          <div class="mt-8 flex flex-wrap gap-3.5 items-center">
            <UButton :to="localePath('/aanmelden')" color="primary" size="xl" trailing-icon="i-lucide-arrow-right">
              {{ t('hero.cta') }}
            </UButton>
            <UButton to="#demo" color="neutral" variant="outline" size="xl">
              {{ t('hero.demo') }}
            </UButton>
          </div>
          <p class="mt-4 flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-shield-check" class="size-4 text-green-700" />
            {{ t('hero.note') }}
          </p>
        </div>

        <div class="rounded-2xl bg-elevated p-7">
          <div class="flex items-center gap-1.5 mb-4">
            <span class="size-2.5 rounded-full bg-sand-300" />
            <span class="size-2.5 rounded-full bg-sand-300" />
            <span class="size-2.5 rounded-full bg-sand-300" />
            <span class="flex-1 ml-2 rounded-md bg-white border border-default px-2.5 py-1.5 text-[11px] text-muted">
              {{ t('hero.mockurl') }}
            </span>
          </div>
          <div class="rounded-xl bg-white p-5 border border-default min-h-60">
            <p class="text-[13px] font-semibold text-muted">{{ t('hero.mockbiz') }}</p>
            <p class="text-base font-semibold mt-1 mb-5">{{ t('hero.mocktitle') }}</p>
            <div class="rounded-lg bg-elevated p-5 text-center">
              <template v-if="!rated">
                <p class="text-sm text-muted mb-2">{{ t('examples.preview.q') }}</p>
                <StarRating :size="30" @rate="rated = $event" />
              </template>
              <template v-else>
                <UIcon
                  :name="rated >= 4 ? 'i-lucide-external-link' : 'i-lucide-lock'"
                  class="size-7 text-green-700 mx-auto"
                />
                <p class="mt-2 text-sm font-semibold text-green-700">
                  {{ rated >= 4 ? t('demo.widget.redirect.title') : t('demo.widget.feedback.title') }}
                </p>
                <UButton class="mt-3" size="xs" variant="link" color="neutral" @click="rated = 0">
                  {{ t('demo.reset') }}
                </UButton>
              </template>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
