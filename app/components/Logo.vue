<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M16 2 5 6v9c0 6.8 4.6 12.3 11 14 6.4-1.7 11-7.2 11-14V6L16 2Z"
      fill="var(--color-green-700)"
    />
    <path
      d="m16 11 1.6 3.4 3.7.4-2.8 2.5.8 3.6L16 22.6l-3.3 1.7.8-3.6-2.8-2.5 3.7-.4L16 11Z"
      fill="var(--color-gold-400)"
    />
  </svg>
</template>
