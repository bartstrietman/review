<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number
  modelValue?: number
  readonly?: boolean
  filled?: number
}>(), { size: 28, modelValue: 0, readonly: false, filled: 0 })

const emit = defineEmits<{ (e: 'update:modelValue', v: number): void; (e: 'rate', v: number): void }>()

const hover = ref(0)
const active = computed(() => hover.value || props.modelValue || props.filled)

function pick(n: number) {
  if (props.readonly) return
  emit('update:modelValue', n)
  emit('rate', n)
}
</script>

<template>
  <div class="flex gap-1.5 justify-center" role="radiogroup">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      :disabled="readonly"
      class="p-1 transition-transform"
      :class="readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'"
      :aria-label="`${n} ${n === 1 ? 'ster' : 'sterren'}`"
      @mouseenter="!readonly && (hover = n)"
      @mouseleave="!readonly && (hover = 0)"
      @click="pick(n)"
    >
      <svg
        :width="size" :height="size" viewBox="0 0 24 24"
        :fill="n <= active ? '#E8C547' : 'none'"
        :stroke="n <= active ? '#E8C547' : '#D8D2C2'"
        stroke-width="1.5" stroke-linejoin="round"
      >
        <path d="M12 3l2.6 5.6 6.1.6-4.6 4.2 1.3 6L12 16.5 6.6 19.4l1.3-6L3.3 9.2l6.1-.6L12 3z" />
      </svg>
    </button>
  </div>
</template>
