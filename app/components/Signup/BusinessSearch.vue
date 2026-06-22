<script setup lang="ts">
export interface PlaceResult {
  title: string; address: string; street: string; postcode: string; city: string
  phone: string; website: string; placeId: string
  rating: number | null; ratingCount: number | null; reviewUrl: string
}

const emit = defineEmits<{ select: [place: PlaceResult] }>()
const { t } = useI18n()

const q = ref('')
const loading = ref(false)
const results = ref<PlaceResult[]>([])
const searched = ref(false)

async function search() {
  if (q.value.trim().length < 2) return
  loading.value = true
  try {
    const res = await $fetch<{ results: PlaceResult[] }>('/api/places', { method: 'POST', body: { q: q.value } })
    results.value = res.results
  }
  catch {
    results.value = []
  }
  finally {
    loading.value = false
    searched.value = true
  }
}

function pick(p: PlaceResult) {
  emit('select', p)
  results.value = []
  searched.value = false
}
</script>

<template>
  <div class="rounded-xl border border-default bg-elevated p-4 mb-6">
    <label class="flex items-center gap-2 text-sm font-semibold mb-2">
      <UIcon name="i-lucide-map-pin" class="size-4 text-green-700" />
      {{ t('search.label') }}
    </label>
    <div class="flex gap-2">
      <UInput v-model="q" class="flex-1" :placeholder="t('search.placeholder')" @keydown.enter.prevent="search" />
      <UButton color="primary" :loading="loading" icon="i-lucide-search" @click="search">{{ t('search.button') }}</UButton>
    </div>

    <div v-if="results.length" class="mt-3 space-y-1.5">
      <button
        v-for="p in results" :key="p.placeId || p.title"
        type="button"
        class="w-full text-left rounded-lg border border-default bg-white px-3.5 py-2.5 hover:border-green-400 transition-colors"
        @click="pick(p)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-sm truncate">{{ p.title }}</span>
          <span v-if="p.rating" class="shrink-0 text-xs text-muted flex items-center gap-1">
            <UIcon name="i-lucide-star" class="size-3 text-gold-500" />{{ p.rating }} ({{ p.ratingCount }})
          </span>
        </div>
        <div class="text-xs text-muted truncate">{{ p.address }}</div>
      </button>
    </div>

    <p v-else-if="searched" class="mt-2 text-xs text-muted">{{ t('search.none') }}</p>
    <p v-else class="mt-2 text-xs text-muted">{{ t('search.hint') }}</p>
  </div>
</template>
