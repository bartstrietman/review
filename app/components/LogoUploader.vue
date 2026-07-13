<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{
  customerId: string
  modelValue: string | null
  label?: string
  help?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [url: string] }>()

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()
const toast = useToast()

const uploading = ref(false)
const inputEl = ref<HTMLInputElement>()

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}
const MAX_BYTES = 2_000_000

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (inputEl.value) inputEl.value.value = ''

  const ext = ALLOWED[file.type]
  if (!ext) { toast.add({ title: t('dash.set.logoBadType'), color: 'error' }); return }
  if (file.size > MAX_BYTES) { toast.add({ title: t('dash.set.logoTooLarge'), color: 'error' }); return }

  uploading.value = true
  const path = `${props.customerId}/${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: false, contentType: file.type })
  if (error) {
    uploading.value = false
    toast.add({ title: error.message, color: 'error' })
    return
  }
  const publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
  const { error: updateError } = await supabase.from('customers').update({ logo_url: publicUrl }).eq('id', props.customerId)
  uploading.value = false
  if (updateError) { toast.add({ title: updateError.message, color: 'error' }); return }

  emit('update:modelValue', publicUrl)
  toast.add({ title: t('dash.set.logoSaved'), color: 'success', icon: 'i-lucide-check' })
}
</script>

<template>
  <UFormField :label="label ?? t('dash.set.logo')" :help="help ?? t('dash.set.logoHelp')">
    <div class="flex items-center gap-4">
      <div class="size-16 rounded-lg border border-default bg-elevated flex items-center justify-center overflow-hidden shrink-0">
        <img v-if="modelValue" :src="modelValue" alt="" class="size-full object-contain">
        <UIcon v-else name="i-lucide-image" class="size-6 text-muted" />
      </div>
      <div>
        <UButton
          size="sm" color="neutral" variant="soft" icon="i-lucide-upload" :loading="uploading"
          @click="inputEl?.click()"
        >
          {{ modelValue ? t('dash.set.logoReplace') : t('dash.set.logoUpload') }}
        </UButton>
        <p v-if="!modelValue" class="text-xs text-muted mt-1.5">{{ t('dash.set.logoNone') }}</p>
        <input
          ref="inputEl" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          class="hidden" @change="onFileChange"
        >
      </div>
    </div>
  </UFormField>
</template>
