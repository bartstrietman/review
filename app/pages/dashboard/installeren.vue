<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin
const { customer } = useMyBusiness()

const previewOpen = ref(false)

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

        <!-- LIVE PREVIEW of the popup -->
        <UCard>
          <template #header><h2 class="font-semibold">{{ t('dash.install.previewTitle') }}</h2></template>
          <div class="grid md:grid-cols-[1fr_auto] gap-5 items-start">
            <div>
              <p class="text-sm text-muted mb-3">{{ t('dash.install.previewD') }}</p>
              <!-- mock website with the launcher / popup contained inside -->
              <div class="relative h-80 rounded-xl border border-default bg-white overflow-hidden">
                <!-- fake page content -->
                <div class="p-5">
                  <div class="flex items-center gap-1.5 mb-4">
                    <span class="size-2 rounded-full bg-sand-200" />
                    <span class="size-2 rounded-full bg-sand-200" />
                    <span class="size-2 rounded-full bg-sand-200" />
                    <span class="ml-2 h-4 flex-1 max-w-48 rounded bg-elevated" />
                  </div>
                  <p class="font-semibold">{{ t('dash.install.mockTitle') }}</p>
                  <p class="text-sm text-muted">{{ t('dash.install.mockSub') }}</p>
                  <div class="mt-4 space-y-2">
                    <div class="h-2.5 w-3/4 rounded bg-elevated" />
                    <div class="h-2.5 w-1/2 rounded bg-elevated" />
                  </div>
                </div>

                <!-- launcher button (matches the real widget) -->
                <button
                  v-if="!previewOpen"
                  type="button"
                  class="absolute bottom-4 right-4 rounded-full bg-green-700 text-white text-sm font-semibold px-4 py-2.5 shadow-lg hover:bg-green-600 transition-colors"
                  @click="previewOpen = true"
                >
                  {{ t('dash.install.launcher') }}
                </button>
                <span v-if="!previewOpen" class="absolute bottom-16 right-4 text-xs text-muted">{{ t('dash.install.tryIt') }}</span>

                <!-- popup overlay (scoped to the preview box) -->
                <div v-else class="absolute inset-0 bg-black/45 flex items-center justify-center p-3">
                  <div class="relative w-full max-w-[300px]">
                    <button
                      type="button" aria-label="Sluiten"
                      class="absolute -top-7 right-0 text-white text-2xl leading-none"
                      @click="previewOpen = false"
                    >&times;</button>
                    <iframe
                      :src="`/r/${customer?.slug}`" title="Review-voorbeeld"
                      class="w-full rounded-2xl border-0 bg-white" style="height:290px"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- how it works -->
            <div class="md:w-56">
              <h3 class="font-semibold text-sm mb-2">{{ t('dash.install.howTitle') }}</h3>
              <ol class="space-y-2.5">
                <li v-for="(s, i) in [t('dash.install.how1'), t('dash.install.how2'), t('dash.install.how3')]" :key="i" class="flex gap-2.5 text-sm">
                  <span class="size-5 shrink-0 rounded-full bg-green-700 text-white text-[11px] flex items-center justify-center font-bold">{{ i + 1 }}</span>
                  <span class="text-muted">{{ s }}</span>
                </li>
              </ol>
            </div>
          </div>
        </UCard>

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
