<script setup lang="ts">
import { z } from 'zod'

const { t } = useI18n()
const supabase = useSupabaseClient()

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ name: '', email: '', message: '' })
const done = ref(false)
const loading = ref(false)
const toast = useToast()

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.from('contact_messages').insert({
    name: state.name, email: state.email, message: state.message,
  })
  loading.value = false
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
    return
  }
  done.value = true
}

usePageTitle(() => t('contactpage.h1'))
</script>

<template>
  <UContainer class="py-16 sm:py-20">
    <div class="grid md:grid-cols-2 gap-12 max-w-4xl">
      <div>
        <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
          <span class="size-1.5 rounded-full bg-gold-400" />{{ t('contactpage.eyebrow') }}
        </p>
        <h1 class="mt-3.5 text-4xl font-bold tracking-tight">{{ t('contactpage.h1') }}</h1>
        <p class="mt-3 text-lg text-muted">{{ t('contactpage.sub') }}</p>

        <div class="mt-8 space-y-5">
          <div>
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-4 text-green-700" />{{ t('contact.email.h') }}
            </h3>
            <p class="text-sm text-muted mt-1">{{ t('contact.supportEmail') }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-clock" class="size-4 text-green-700" />{{ t('contact.response.h') }}
            </h3>
            <p class="text-sm text-muted mt-1">{{ t('contact.response.p') }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-log-out" class="size-4 text-green-700" />{{ t('contact.opzeg.h') }}
            </h3>
            <p class="text-sm text-muted mt-1">{{ t('contact.opzeg.p') }}</p>
          </div>
        </div>
      </div>

      <UCard variant="outline" class="rounded-2xl self-start w-full">
        <h2 class="text-lg font-semibold mb-5">{{ t('contact.form.h') }}</h2>
        <div v-if="done" class="flex items-start gap-2.5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <UIcon name="i-lucide-check-circle" class="size-5 shrink-0" />
          {{ t('contact.form.confirm') }}
        </div>
        <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField :label="t('contact.form.name')" name="name">
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <UFormField :label="t('contact.form.email')" name="email">
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField :label="t('contact.form.msg')" name="message">
            <UTextarea v-model="state.message" :rows="5" class="w-full" />
          </UFormField>
          <UButton type="submit" color="primary" :loading="loading" block size="lg">
            {{ t('contact.form.btn') }}
          </UButton>
        </UForm>
      </UCard>
    </div>
  </UContainer>
</template>
