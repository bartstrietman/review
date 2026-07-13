<script setup lang="ts">
// Lightweight inline-SVG line chart for the review-count history: green line,
// open dots, soft gradient fill — the last point emphasized. No chart deps.
const props = withDefaults(defineProps<{
  values: number[]
  height?: number
  ghost?: boolean
}>(), { height: 150, ghost: false })

const W = 560
const PAD = { top: 14, right: 18, bottom: 10, left: 8 }

const coords = computed(() => {
  const vals = props.values
  if (vals.length < 2) return []
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = props.height - PAD.top - PAD.bottom
  return vals.map((v, i) => ({
    x: PAD.left + (i / (vals.length - 1)) * innerW,
    y: PAD.top + (1 - (v - min) / span) * innerH,
  }))
})

const linePath = computed(() => coords.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const areaPath = computed(() => {
  if (!coords.value.length) return ''
  const first = coords.value[0]!
  const last = coords.value.at(-1)!
  return `${linePath.value} L${last.x.toFixed(1)},${props.height} L${first.x.toFixed(1)},${props.height} Z`
})

// With many (daily) points the dots become noise — keep first, last and ~5 in between.
const dots = computed(() => {
  const c = coords.value
  if (c.length <= 8) return c
  const step = Math.ceil(c.length / 6)
  return c.filter((_, i) => i === 0 || i === c.length - 1 || i % step === 0)
})

const gradId = useId()
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${height}`" class="w-full" :style="{ height: 'auto' }" aria-hidden="true">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#15523E" stop-opacity="0.16" />
        <stop offset="100%" stop-color="#15523E" stop-opacity="0" />
      </linearGradient>
    </defs>
    <template v-if="coords.length">
      <path v-if="!ghost" :d="areaPath" :fill="`url(#${gradId})`" />
      <path
        :d="linePath" fill="none" stroke="#15523E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
        :stroke-dasharray="ghost ? '2 7' : undefined" :opacity="ghost ? 0.35 : 1"
      />
      <template v-if="!ghost">
        <circle v-for="(p, i) in dots" :key="i" :cx="p.x" :cy="p.y" r="7" fill="white" stroke="#15523E" stroke-width="3" />
        <circle :cx="coords.at(-1)!.x" :cy="coords.at(-1)!.y" r="7" fill="#0F3D2E" stroke="white" stroke-width="3" />
      </template>
    </template>
  </svg>
</template>
