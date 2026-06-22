<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin
const { customer } = useMyBusiness()

const reviewUrl = computed(() => customer.value ? `${origin}/r/${customer.value.slug}` : '')
const popupCode = computed(() => customer.value
  ? `<script src="${origin}/widget/${customer.value.slug}.js" data-mode="popup"><\/script>` : '')
const embedCode = computed(() => customer.value
  ? `<div id="rs-embed-${customer.value.slug}"></div>\n<script src="${origin}/widget/${customer.value.slug}.js" data-mode="embed" data-target="rs-embed-${customer.value.slug}"><\/script>` : '')

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.add({ title: 'Gekopieerd', color: 'success', icon: 'i-lucide-check' }) }
  catch { toast.add({ title: 'Kon niet kopiëren', color: 'error' }) }
}

const steps = computed(() => [
  { h: t('dash.install.s1'), p: t('dash.install.s1d') },
  { h: t('dash.install.s2'), p: t('dash.install.s2d') },
  { h: t('dash.install.s3'), p: t('dash.install.s3d') },
])

useSeoMeta({ title: 'Installeren — ReviewShield' })
</script>

<template>
  <UDashboardPanel id="dash-install">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.install')">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl space-y-6">
        <p class="text-muted">{{ t('dash.install.intro') }}</p>

        <!-- popup -->
        <UCard>
          <div class="flex items-center gap-2 mb-1.5">
            <UBadge color="primary" variant="subtle">Optie 1</UBadge>
            <h2 class="font-semibold">{{ t('dash.install.popup') }}</h2>
          </div>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.popupD') }}</p>
          <div class="relative">
            <pre class="overflow-x-auto rounded-lg bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ popupCode }}</code></pre>
            <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" icon="i-lucide-copy" @click="copy(popupCode)" />
          </div>
        </UCard>

        <!-- embed -->
        <UCard>
          <div class="flex items-center gap-2 mb-1.5">
            <UBadge color="primary" variant="subtle">Optie 2</UBadge>
            <h2 class="font-semibold">{{ t('dash.install.embed') }}</h2>
          </div>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.embedD') }}</p>
          <div class="relative">
            <pre class="overflow-x-auto rounded-lg bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ embedCode }}</code></pre>
            <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" icon="i-lucide-copy" @click="copy(embedCode)" />
          </div>
        </UCard>

        <!-- direct link + QR -->
        <UCard>
          <h2 class="font-semibold mb-1">{{ t('dash.install.noSite') }}</h2>
          <p class="text-sm text-muted mb-3">{{ t('dash.install.noSiteD') }}</p>
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <QrCode :value="reviewUrl" :size="140" />
            <div class="flex-1 w-full">
              <div class="flex gap-2">
                <UInput :model-value="reviewUrl" readonly class="flex-1 font-mono text-xs" :aria-label="t('dash.link.label')" />
                <UButton icon="i-lucide-copy" color="primary" :aria-label="t('dash.link.copy')" @click="copy(reviewUrl)" />
                <UButton :to="`/r/${customer?.slug}`" target="_blank" icon="i-lucide-external-link" color="neutral" variant="soft" :aria-label="t('dash.reviewPage')" />
              </div>
              <p class="text-xs text-muted mt-2">{{ t('dash.install.scan') }}</p>
            </div>
          </div>
        </UCard>

        <!-- steps -->
        <div>
          <h2 class="font-semibold mb-3">{{ t('dash.install.steps') }}</h2>
          <div class="space-y-3">
            <div v-for="(s, i) in steps" :key="i" class="flex gap-4 rounded-xl border border-default bg-white p-5">
              <span class="size-8 shrink-0 rounded-full bg-green-700 text-white flex items-center justify-center font-display font-bold text-sm">{{ i + 1 }}</span>
              <div>
                <h3 class="font-semibold text-sm">{{ s.h }}</h3>
                <p class="text-sm text-muted mt-1">{{ s.p }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
