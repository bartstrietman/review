<script setup lang="ts">
const { t } = useI18n()
const items = computed(() => [t('trust.1'), t('trust.2'), t('trust.3')])
</script>

<template>
  <div class="border-b border-default bg-elevated py-3.5">
    <UContainer class="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm font-medium text-muted">
      <span v-for="item in items" :key="item" class="flex items-center gap-1.5">
        <UIcon name="i-lucide-check" class="size-4 text-green-700" />
        {{ item }}
      </span>
    </UContainer>
  </div>
</template>
