<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { PRICING_PLAN } from '~/data/marketing'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const supabase = useSupabaseClient<Database>()
const toast = useToast()

const slug = computed(() => route.params.slug as string)
const origin = useRequestURL().origin
const reviewUrl = computed(() => `${origin}/r/${slug.value}`)

const { data: customer } = await useAsyncData(`customer-${slug.value}`, async () => {
  const { data } = await supabase.from('customers').select('*').eq('slug', slug.value).single()
  return data
})

const popupCode = computed(() =>
  `<script src="${origin}/widget/${slug.value}.js" data-mode="popup"><\/script>`,
)
const embedCode = computed(() =>
  `<div id="rs-embed-${slug.value}"></div>\n<script src="${origin}/widget/${slug.value}.js" data-mode="embed" data-target="rs-embed-${slug.value}"><\/script>`,
)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Gekopieerd', color: 'success', icon: 'i-lucide-check' })
  }
  catch {
    toast.add({ title: 'Kon niet kopiëren', color: 'error' })
  }
}

const pkgLabel = computed(() => `${PRICING_PLAN.price} / ${t('pricing.permonth')}`)

usePageTitle(() => t('conf.h1'))
</script>

<template>
  <UContainer class="py-14 sm:py-18 max-w-2xl">
    <div class="text-center">
      <div class="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-party-popper" class="size-7 text-green-700" />
      </div>
      <p class="text-xs font-semibold uppercase tracking-wider text-green-700">{{ t('conf.eyebrow') }}</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight">{{ customer?.company_name || t('conf.h1') }}</h1>
      <p class="mt-2 text-muted">{{ t('conf.sub') }}</p>
    </div>

    <!-- summary -->
    <div v-if="customer" class="grid sm:grid-cols-2 gap-3 mt-10">
      <div class="rounded-xl border border-default bg-white p-4">
        <div class="text-xs text-muted">{{ t('conf.detail.biz') }}</div>
        <div class="font-semibold mt-0.5">{{ customer.company_name || '—' }}</div>
      </div>
      <div class="rounded-xl border border-default bg-white p-4">
        <div class="text-xs text-muted">{{ t('conf.detail.pkg') }}</div>
        <div class="font-semibold mt-0.5">{{ pkgLabel }}</div>
      </div>
      <div class="rounded-xl border border-default bg-white p-4">
        <div class="text-xs text-muted">{{ t('conf.detail.color') }}</div>
        <div class="font-semibold mt-0.5 flex items-center gap-2">
          <span class="size-4 rounded border border-default" :style="{ background: customer.bg_color }" />
          {{ customer.bg_color }}
        </div>
      </div>
      <div class="rounded-xl border border-default bg-white p-4">
        <div class="text-xs text-muted">{{ t('conf.detail.tel') }}</div>
        <div class="font-semibold mt-0.5">{{ customer.phone || t('conf.detail.notfilled') }}</div>
      </div>
    </div>

    <!-- review page link -->
    <div class="mt-10 rounded-xl border border-green-200 bg-green-50 p-5">
      <div class="flex items-center gap-2 mb-1.5">
        <UIcon name="i-lucide-link" class="size-4 text-green-700" />
        <h3 class="font-semibold text-green-800">Jouw reviewpagina</h3>
      </div>
      <p class="text-sm text-green-800/80 mb-3">Deel deze link met klanten (QR-code, mail of WhatsApp). Een cijfer kan ook direct mee: <code class="text-xs">?score=5</code>.</p>
      <div class="flex items-center gap-2">
        <UInput :model-value="reviewUrl" readonly class="flex-1 font-mono text-sm" />
        <UButton icon="i-lucide-copy" color="primary" @click="copy(reviewUrl)">Kopieer</UButton>
        <UButton :to="`/r/${slug}`" target="_blank" icon="i-lucide-external-link" color="neutral" variant="soft">Open</UButton>
      </div>
    </div>

    <!-- embed snippets -->
    <div class="mt-8 space-y-6">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <UBadge color="primary" variant="subtle">{{ t('conf.opt1.tag') }}</UBadge>
          <h3 class="font-semibold">{{ t('conf.opt1.h') }}</h3>
        </div>
        <p class="text-sm text-muted mb-2.5">{{ t('conf.opt1.p') }}</p>
        <div class="relative">
          <pre class="overflow-x-auto rounded-xl bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ popupCode }}</code></pre>
          <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" variant="solid" icon="i-lucide-copy" @click="copy(popupCode)" />
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-2">
          <UBadge color="primary" variant="subtle">{{ t('conf.opt2.tag') }}</UBadge>
          <h3 class="font-semibold">{{ t('conf.opt2.h') }}</h3>
        </div>
        <p class="text-sm text-muted mb-2.5">{{ t('conf.opt2.p') }}</p>
        <div class="relative">
          <pre class="overflow-x-auto rounded-xl bg-green-900 text-green-50 text-xs p-4 pr-12"><code>{{ embedCode }}</code></pre>
          <UButton class="absolute top-2.5 right-2.5" size="xs" color="neutral" variant="solid" icon="i-lucide-copy" @click="copy(embedCode)" />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mt-10">
      <UButton :to="localePath('/hoe-werkt-het')" color="primary" variant="soft">{{ t('conf.howbtn') }}</UButton>
      <UButton :to="localePath('/faq')" color="neutral" variant="soft">{{ t('conf.faqbtn') }}</UButton>
      <UButton :to="localePath('/dashboard')" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right">Dashboard</UButton>
    </div>
  </UContainer>
</template>
