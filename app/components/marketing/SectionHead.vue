<script setup lang="ts">
defineProps<{ eyebrow?: string; title?: string; sub?: string; inverted?: boolean }>()
</script>

<template>
  <div class="max-w-2xl mb-12">
    <p
      class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
      :class="inverted ? 'text-gold-400' : 'text-green-700'"
    >
      <span class="size-1.5 rounded-full bg-gold-400" />
      {{ eyebrow }}
    </p>
    <h2 class="mt-3.5 text-3xl font-bold tracking-tight" :class="inverted ? 'text-white' : ''">
      {{ title }}
    </h2>
    <p class="mt-3 text-lg" :class="inverted ? 'text-green-100/80' : 'text-muted'">{{ sub }}</p>
  </div>
</template>
