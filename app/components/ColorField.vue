<script setup lang="ts">
// A colour field with a real picker: the swatch opens the native OS colour
// picker, and the hex input stays editable by hand. Both stay in sync.
const props = defineProps<{ modelValue: string, label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

// <input type="color"> only accepts #rrggbb — keep a valid value for it even
// while the text field holds a half-typed hex.
const swatch = computed(() => (/^#[0-9a-fA-F]{6}$/.test(props.modelValue) ? props.modelValue : '#000000'))

function set(v: string) { emit('update:modelValue', v.toUpperCase()) }
</script>

<template>
  <UFormField :label="label">
    <div class="flex items-center gap-2">
      <label
        class="relative size-9 rounded-md border border-default overflow-hidden cursor-pointer shrink-0"
        :style="{ background: swatch }"
      >
        <input
          type="color" :value="swatch"
          class="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          :aria-label="label"
          @input="set(($event.target as HTMLInputElement).value)"
        >
      </label>
      <UInput :model-value="modelValue" class="w-32 font-mono" @update:model-value="set($event as string)" />
    </div>
  </UFormField>
</template>
