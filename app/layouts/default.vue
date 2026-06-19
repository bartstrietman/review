<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const router = useRouter()

const navLinks = computed(() => [
  { label: t('nav.how'), to: localePath('/hoe-werkt-het') },
  { label: t('nav.demo'), to: localePath('/') + '#demo' },
  { label: t('nav.pricing'), to: localePath('/') + '#pricing' },
  { label: t('nav.faq'), to: localePath('/faq') },
  { label: t('nav.contact'), to: localePath('/contact') },
])

const mobileOpen = ref(false)
function go(to: string) {
  mobileOpen.value = false
  router.push(to)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-cream">
    <header class="sticky top-0 z-50 border-b border-default bg-[rgba(250,248,243,0.92)] backdrop-blur">
      <UContainer class="flex items-center justify-between gap-4 py-3.5">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 font-display text-lg font-bold">
          <Logo :size="28" />
          ReviewShield
        </NuxtLink>

        <nav class="hidden md:flex gap-7 text-sm font-medium text-muted">
          <NuxtLink
            v-for="link in navLinks" :key="link.label" :to="link.to"
            class="transition-colors hover:text-highlighted"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex overflow-hidden rounded-md border border-default text-xs font-semibold">
            <NuxtLink
              v-for="l in locales" :key="l.code"
              :to="switchLocalePath(l.code)"
              class="px-3 py-1.5 transition-colors"
              :class="locale === l.code ? 'bg-green-700 text-white' : 'text-muted hover:text-highlighted'"
            >
              {{ l.code.toUpperCase() }}
            </NuxtLink>
          </div>
          <UButton :to="localePath('/aanmelden')" color="primary" size="md" class="hidden sm:inline-flex">
            {{ t('nav.cta') }}
          </UButton>
          <UButton
            class="md:hidden" color="neutral" variant="ghost" icon="i-lucide-menu"
            :aria-label="t('nav.cta')" @click="mobileOpen = true"
          />
        </div>
      </UContainer>
    </header>

    <USlideover v-model:open="mobileOpen" :title="t('nav.cta')" side="right">
      <template #body>
        <div class="flex flex-col gap-1">
          <UButton
            v-for="link in navLinks" :key="link.label"
            variant="ghost" color="neutral" block class="justify-start"
            @click="go(link.to)"
          >
            {{ link.label }}
          </UButton>
          <USeparator class="my-3" />
          <div class="flex gap-2">
            <UButton
              v-for="l in locales" :key="l.code"
              :to="switchLocalePath(l.code)" size="sm"
              :variant="locale === l.code ? 'solid' : 'outline'" color="primary"
              @click="mobileOpen = false"
            >
              {{ l.code.toUpperCase() }}
            </UButton>
          </div>
          <UButton :to="localePath('/aanmelden')" color="primary" block class="mt-3" @click="mobileOpen = false">
            {{ t('nav.cta') }}
          </UButton>
        </div>
      </template>
    </USlideover>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default bg-elevated">
      <UContainer class="py-12">
        <div class="flex flex-col md:flex-row gap-8 justify-between">
          <div class="max-w-xs">
            <div class="flex items-center gap-2.5 font-display text-lg font-bold">
              <Logo :size="26" />
              ReviewShield
            </div>
            <p class="mt-3 text-sm text-muted">{{ t('hero.eyebrow') }}</p>
          </div>
          <div class="flex gap-12 text-sm">
            <div class="flex flex-col gap-2">
              <NuxtLink :to="localePath('/hoe-werkt-het')" class="text-muted hover:text-highlighted">{{ t('nav.how') }}</NuxtLink>
              <NuxtLink :to="localePath('/faq')" class="text-muted hover:text-highlighted">{{ t('nav.faq') }}</NuxtLink>
              <NuxtLink :to="localePath('/contact')" class="text-muted hover:text-highlighted">{{ t('nav.contact') }}</NuxtLink>
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink :to="localePath('/aanmelden')" class="text-muted hover:text-highlighted">{{ t('nav.cta') }}</NuxtLink>
              <NuxtLink :to="localePath('/login')" class="text-muted hover:text-highlighted">Login</NuxtLink>
            </div>
          </div>
        </div>
        <USeparator class="my-8" />
        <p class="text-xs text-muted">{{ t('footer.copy') }}</p>
      </UContainer>
    </footer>
  </div>
</template>
