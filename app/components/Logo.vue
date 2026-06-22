<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <!-- shield -->
    <path
      d="M16 2.5 26.5 6.4V15c0 6.9-4.4 12.2-10.5 14.5C9.9 27.2 5.5 21.9 5.5 15V6.4L16 2.5Z"
      fill="#0F3D2E"
    />
    <!-- subtle inner rim -->
    <path
      d="M16 5 23.8 7.9V15c0 5.4-3.3 9.6-7.8 11.5C11.5 24.6 8.2 20.4 8.2 15V7.9L16 5Z"
      stroke="#1B6750"
      stroke-width="0.8"
      fill="none"
    />
    <!-- centred 5-point star -->
    <path
      d="M16 8.6 17.7 13.0 22.4 13.3 18.7 16.2 20 20.8 16 18.1 12 20.8 13.3 16.2 9.6 13.3 14.3 13.0Z"
      fill="#E8C547"
    />
  </svg>
</template>
