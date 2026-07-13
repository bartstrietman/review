<script setup lang="ts">
// Click-to-edit text field. Display mode renders the text exactly as it looks
// in the email (normal, dark — no grey placeholder chrome). Click → a bordered
// editor with a "{field} bewerken" toolbar, restore-default link and counter.
//
// Two modes via `fallback`:
//  - with fallback  → override pattern: empty modelValue shows the default;
//    committing text equal to the default clears the override back to ''.
//  - without        → plain: empty shows `placeholder`, commit stores raw.
const props = withDefaults(defineProps<{
  modelValue: string
  fallback?: string
  placeholder?: string
  label?: string
  maxlength?: number
  multiline?: boolean // Enter inserts a newline; commit on blur/click-away
  wrap?: boolean // render a textarea (wraps) but Enter still commits
  textClass?: string
  textStyle?: Record<string, string>
}>(), {
  fallback: '', placeholder: '', label: '', maxlength: 0,
  multiline: false, wrap: false, textClass: '', textStyle: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { t } = useI18n()

const editing = ref(false)
const draft = ref('')
const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const hasFallback = computed(() => props.fallback.trim() !== '')
const useTextarea = computed(() => props.wrap || props.multiline)
const effective = computed(() => (props.modelValue.trim() ? props.modelValue : props.fallback))
const isEmpty = computed(() => !effective.value.trim())

async function start() {
  draft.value = effective.value
  editing.value = true
  await nextTick()
  const el = inputEl.value
  el?.focus()
  el?.setSelectionRange?.(el.value.length, el.value.length)
}

function commit() {
  if (!editing.value) return
  editing.value = false
  const v = draft.value.trim()
  emit('update:modelValue', hasFallback.value && v === props.fallback.trim() ? '' : draft.value)
}

function restore() {
  draft.value = props.fallback
  inputEl.value?.focus()
}

function onEnter(e: KeyboardEvent) {
  if (props.multiline) return // allow newline
  e.preventDefault()
  commit()
}
</script>

<template>
  <span
    v-if="!editing"
    class="group inline-flex items-start gap-1.5 cursor-text rounded-md px-1.5 -mx-1.5 py-0.5 transition-colors hover:bg-primary/[0.07]"
    @click="start"
  >
    <span
      :class="[textClass, 'whitespace-pre-wrap', isEmpty ? 'text-muted italic' : '']"
      :style="isEmpty ? undefined : textStyle"
    >{{ isEmpty ? placeholder : effective }}</span>
    <UIcon name="i-lucide-pencil" class="size-3.5 mt-1 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-70" />
  </span>

  <div v-else class="my-0.5 overflow-hidden rounded-xl border-2 border-primary bg-white shadow-sm">
    <div class="flex items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-3 py-1.5">
      <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary">
        <UIcon name="i-lucide-pencil" class="size-3.5" /> {{ t('dash.invite.edit.editing', { field: label }) }}
      </span>
      <button
        v-if="hasFallback" type="button"
        class="whitespace-nowrap text-xs text-primary underline underline-offset-2 hover:no-underline"
        @mousedown.prevent="restore"
      >
        {{ t('dash.invite.edit.restore') }}
      </button>
    </div>

    <textarea
      v-if="useTextarea" ref="inputEl" v-model="draft" rows="1"
      :maxlength="maxlength || undefined"
      :class="[textClass, 'block w-full border-0 bg-transparent px-3 py-2 text-default outline-none']"
      :style="textStyle" style="field-sizing:content;resize:none"
      @blur="commit" @keydown.enter="onEnter"
    />
    <input
      v-else ref="inputEl" v-model="draft"
      :maxlength="maxlength || undefined"
      :class="[textClass, 'block w-full border-0 bg-transparent px-3 py-2 text-default outline-none']"
      :style="textStyle" @blur="commit" @keydown.enter="onEnter"
    >

    <div class="flex items-center justify-between gap-3 px-3 pb-1.5 text-xs text-muted">
      <span>{{ multiline ? t('dash.invite.edit.doneMulti') : t('dash.invite.edit.doneSingle') }}</span>
      <span v-if="maxlength" class="shrink-0">{{ draft.length }}/{{ maxlength }}</span>
    </div>
  </div>
</template>
