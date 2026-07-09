<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { siteName } = useSite()

const isAdmin = computed(() => (user.value?.app_metadata as { role?: string } | undefined)?.role === 'admin')

const navLinks = computed(() => [
  { label: t('nav.how'), to: localePath('/hoe-werkt-het') },
  { label: t('nav.demo'), to: localePath('/') + '#demo' },
  { label: t('nav.pricing'), to: localePath('/') + '#pricing' },
  { label: t('nav.faq'), to: localePath('/faq') },
  { label: t('nav.contact'), to: localePath('/contact') },
])

const dashboardPath = computed(() => isAdmin.value ? localePath('/admin') : localePath('/dashboard'))
const accountItems = computed(() => [[
  { label: t('account.dashboard'), icon: 'i-lucide-layout-dashboard', to: localePath('/dashboard') },
  ...(isAdmin.value ? [{ label: t('account.admin'), icon: 'i-lucide-shield', to: localePath('/admin') }] : []),
  { label: t('account.logout'), icon: 'i-lucide-log-out', onSelect: () => logout() },
]])

function isNavActive(to: string) {
  const [pathPart, hash] = to.split('#')
  const path = pathPart || '/'
  const pathMatch = route.path === path || route.path === `${path}/`
  if (hash) return pathMatch && route.hash === `#${hash}`
  if (path === localePath('/') || path === '/') return pathMatch && !route.hash
  return pathMatch
}

async function logout() {
  await supabase.auth.signOut()
  mobileOpen.value = false
  await router.push(localePath('/'))
}

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
          {{ siteName }}
        </NuxtLink>

        <nav class="hidden md:flex gap-7 text-sm font-medium text-muted">
          <NuxtLink
            v-for="link in navLinks" :key="link.label" :to="link.to"
            class="transition-colors hover:text-highlighted"
            :class="isNavActive(link.to) ? 'text-highlighted' : ''"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex overflow-hidden rounded-md border border-default text-xs font-semibold">
            <button
              v-for="l in locales" :key="l.code"
              type="button"
              class="px-3 py-1.5 transition-colors"
              :class="locale === l.code ? 'bg-green-700 text-white' : 'text-muted hover:text-highlighted'"
              @click="setLocale(l.code)"
            >
              {{ l.code.toUpperCase() }}
            </button>
          </div>
          <template v-if="user">
            <UDropdownMenu :items="accountItems" :content="{ align: 'end' }">
              <UButton color="neutral" variant="ghost" size="md" class="hidden sm:inline-flex" trailing-icon="i-lucide-chevron-down">
                <UAvatar :alt="user.email || 'Account'" size="2xs" />
                <span class="max-w-32 truncate">{{ user.email }}</span>
              </UButton>
            </UDropdownMenu>
            <UButton
              :to="dashboardPath" color="primary" size="md"
              icon="i-lucide-layout-dashboard" class="hidden sm:inline-flex"
            >
              {{ isAdmin ? t('nav.admin') : t('nav.dashboard') }}
            </UButton>
          </template>
          <template v-else>
            <UButton :to="localePath('/login')" color="neutral" variant="ghost" size="md" class="hidden sm:inline-flex">
              {{ t('nav.login') }}
            </UButton>
            <UButton :to="localePath('/aanmelden')" color="primary" size="md" class="hidden sm:inline-flex">
              {{ t('nav.cta') }}
            </UButton>
          </template>
          <UButton
            class="md:hidden" color="neutral" variant="ghost" icon="i-lucide-menu"
            :aria-label="t('nav.menu')" @click="mobileOpen = true"
          />
        </div>
      </UContainer>
    </header>

    <USlideover v-model:open="mobileOpen" :title="t('nav.menu')" side="right">
      <template #body>
        <div class="flex flex-col gap-1">
          <UButton
            v-for="link in navLinks" :key="link.label"
            variant="ghost" color="neutral" block class="justify-start"
            :class="isNavActive(link.to) ? 'text-highlighted' : ''"
            @click="go(link.to)"
          >
            {{ link.label }}
          </UButton>
          <USeparator class="my-3" />
          <div class="flex gap-2">
            <UButton
              v-for="l in locales" :key="l.code"
              size="sm"
              :variant="locale === l.code ? 'solid' : 'outline'" color="primary"
              @click="setLocale(l.code)"
            >
              {{ l.code.toUpperCase() }}
            </UButton>
          </div>
          <template v-if="user">
            <div class="mt-3 flex items-center gap-2.5 px-1 text-sm">
              <UAvatar :alt="user.email || 'Account'" size="2xs" />
              <span class="truncate text-muted">{{ user.email }}</span>
            </div>
            <UButton
              :to="localePath('/dashboard')" color="primary" block class="mt-2"
              icon="i-lucide-layout-dashboard" @click="mobileOpen = false"
            >
              {{ t('account.dashboard') }}
            </UButton>
            <UButton
              v-if="isAdmin" :to="localePath('/admin')" color="neutral" variant="soft" block class="mt-2"
              icon="i-lucide-shield" @click="mobileOpen = false"
            >
              {{ t('account.admin') }}
            </UButton>
            <UButton color="neutral" variant="soft" block class="mt-2" icon="i-lucide-log-out" @click="logout">
              {{ t('account.logout') }}
            </UButton>
          </template>
          <template v-else>
            <UButton :to="localePath('/login')" color="neutral" variant="soft" block class="mt-3" @click="mobileOpen = false">
              {{ t('nav.login') }}
            </UButton>
            <UButton :to="localePath('/aanmelden')" color="primary" block class="mt-2" @click="mobileOpen = false">
              {{ t('nav.cta') }}
            </UButton>
          </template>
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
              {{ siteName }}
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
              <NuxtLink :to="localePath('/login')" class="text-muted hover:text-highlighted">{{ t('nav.login') }}</NuxtLink>
            </div>
          </div>
        </div>
        <USeparator class="my-8" />
        <p class="text-xs text-muted">{{ t('footer.copy') }}</p>
      </UContainer>
    </footer>
  </div>
</template>
