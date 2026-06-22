<script setup lang="ts">
const { t } = useI18n()
const items = computed(() => [
  { label: t('trust.1'), icon: 'i-lucide-shield-check' },
  { label: t('trust.2'), icon: 'i-lucide-zap' },
  { label: t('trust.3'), icon: 'i-lucide-x' },
])
</script>

<template>
  <div class="border-b border-default bg-elevated py-3.5">
    <UContainer class="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm font-medium text-muted">
      <span v-for="item in items" :key="item.label" class="flex items-center gap-1.5">
        <UIcon :name="item.icon" class="size-4 text-green-700" />
        {{ item.label }}
      </span>
    </UContainer>
  </div>
</template>
