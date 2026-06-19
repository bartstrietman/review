<script setup lang="ts">
const { t } = useI18n()
const supabase = useSupabaseClient()

const email = ref('')
const done = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value.includes('@')) { error.value = 'invalid'; return }
  loading.value = true
  const { error: e } = await supabase.from('leads').insert({ email: email.value, source: 'exit-intent-guide' })
  loading.value = false
  if (e) { error.value = e.message; return }
  done.value = true
}
</script>

<template>
  <div class="border-y border-default bg-elevated py-8">
    <UContainer>
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="md:flex-1">
          <h3 class="text-lg font-semibold">{{ t('exit.h') }}</h3>
          <p class="text-sm text-muted mt-1">{{ t('exit.p') }}</p>
        </div>
        <div v-if="!done" class="flex flex-col gap-1.5 w-full md:w-auto md:min-w-80">
          <div class="flex gap-2.5">
            <UInput
              v-model="email" type="email" class="flex-1"
              placeholder="naam@bedrijf.nl" :color="error ? 'error' : undefined"
              @keydown.enter="submit"
            />
            <UButton color="primary" :loading="loading" @click="submit">{{ t('exit.btn') }}</UButton>
          </div>
        </div>
        <p v-else class="text-sm font-semibold text-green-700 flex items-center gap-1.5">
          <UIcon name="i-lucide-check-circle" class="size-4" />
          {{ t('exit.confirm') }}
        </p>
      </div>
    </UContainer>
  </div>
</template>
