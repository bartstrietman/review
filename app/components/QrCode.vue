<script setup lang="ts">
import QRCode from 'qrcode'

const props = withDefaults(defineProps<{ value: string; size?: number }>(), { size: 160 })

const svg = ref('')
watchEffect(async () => {
  if (!props.value) { svg.value = ''; return }
  try {
    svg.value = await QRCode.toString(props.value, {
      type: 'svg',
      margin: 1,
      color: { dark: '#0F3D2E', light: '#FFFFFF' },
    })
  }
  catch { svg.value = '' }
})
</script>

<template>
  <ClientOnly>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      class="inline-block rounded-xl border border-default bg-white p-2 [&_svg]:block"
      :style="{ width: `${size}px`, height: `${size}px` }"
      v-html="svg"
    />
  </ClientOnly>
</template>
