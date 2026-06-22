<script setup lang="ts">
defineProps<{
  bg: string
  fg: string
  company: string
  stage: 'rate' | 'review' | 'feedback'
  texts: {
    question: string; hint: string
    reviewTitle: string; reviewSub: string; reviewPrompt: string; reviewPlaceholder: string; reviewBtn: string
    feedbackTitle: string; feedbackSub: string; feedbackPrompt: string; feedbackPlaceholder: string; feedbackBtn: string
  }
}>()
</script>

<template>
  <div class="rounded-2xl p-6 flex items-center justify-center min-h-72" :style="{ background: bg }">
    <div class="w-full max-w-[300px] rounded-2xl bg-white p-6 shadow-xl">
      <p class="text-center text-sm font-semibold text-muted mb-1">{{ company || 'Jouw bedrijf' }}</p>

      <template v-if="stage === 'rate'">
        <h3 class="text-center text-lg font-semibold mb-4">{{ texts.question }}</h3>
        <StarRating :size="30" readonly />
        <p class="text-center text-xs text-muted mt-2">{{ texts.hint }}</p>
      </template>

      <template v-else-if="stage === 'review'">
        <div class="flex items-center gap-2 mb-1">
          <UIcon name="i-lucide-party-popper" class="size-5 text-gold-500" />
          <h3 class="font-semibold">{{ texts.reviewTitle }}</h3>
        </div>
        <p class="text-sm text-muted mb-3">{{ texts.reviewSub }}</p>
        <label class="block text-sm font-semibold mb-1.5">{{ texts.reviewPrompt }}</label>
        <div class="rounded-lg border border-default p-2.5 text-sm text-muted min-h-14">{{ texts.reviewPlaceholder }}</div>
        <div class="mt-3 rounded-lg px-4 py-2.5 text-center font-semibold text-sm" :style="{ background: bg, color: fg }">{{ texts.reviewBtn }}</div>
      </template>

      <template v-else>
        <h3 class="font-semibold mb-1">{{ texts.feedbackTitle }}</h3>
        <p class="text-sm text-muted mb-3">{{ texts.feedbackSub }}</p>
        <label class="block text-sm font-semibold mb-1.5">{{ texts.feedbackPrompt }}</label>
        <div class="rounded-lg border border-default p-2.5 text-sm text-muted min-h-14">{{ texts.feedbackPlaceholder }}</div>
        <div class="mt-3 rounded-lg px-4 py-2.5 text-center font-semibold text-sm" :style="{ background: bg, color: fg }">{{ texts.feedbackBtn }}</div>
      </template>
    </div>
  </div>
</template>
