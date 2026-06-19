<script setup lang="ts">
const props = defineProps<{ modelValue: string; label: string; palette: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const { t } = useI18n()

const hex = ref(props.modelValue)
watch(() => props.modelValue, v => { hex.value = v })

function pick(c: string) { emit('update:modelValue', c.toUpperCase()) }

function onHex() {
  let v = hex.value.trim()
  if (!v.startsWith('#')) v = '#' + v
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) emit('update:modelValue', v.toUpperCase())
}

function isLight(c: string) { return c.toUpperCase() === '#FFFFFF' || c.toUpperCase() === '#FAF8F3' }
</script>

<template>
  <UFormField :label="label" class="mb-5">
    <div class="flex flex-wrap gap-2 mb-3">
      <button
        v-for="c in palette" :key="c"
        type="button"
        class="size-7 rounded-md transition-transform hover:scale-110"
        :class="modelValue.toUpperCase() === c.toUpperCase() ? 'ring-2 ring-green-700 ring-offset-2' : ''"
        :style="{ background: c, border: isLight(c) ? '1px solid var(--color-sand-200)' : 'none' }"
        :aria-label="c"
        @click="pick(c)"
      />
    </div>
    <div class="flex items-center gap-2.5">
      <span class="size-8 rounded-md border border-default shrink-0" :style="{ background: modelValue }" />
      <UInput v-model="hex" maxlength="7" placeholder="#0F3D2E" class="w-32" @input="onHex" />
      <span class="text-xs text-muted">{{ t('flow.style.hex') }}</span>
    </div>
  </UFormField>
</template>
