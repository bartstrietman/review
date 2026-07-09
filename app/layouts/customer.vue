<script setup lang="ts">
const { t } = useI18n()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const localePath = useLocalePath()
const router = useRouter()
const { siteName } = useSite()
const { customers, customer, selectedId } = useMyBusiness()

const links = computed(() => [[
  { label: t('dash.nav.overview'), icon: 'i-lucide-layout-dashboard', to: localePath('/dashboard'), exact: true },
  { label: t('dash.widget.nav'), icon: 'i-lucide-paintbrush', to: localePath('/dashboard/widget') },
  { label: t('dash.nav.invite'), icon: 'i-lucide-user-plus', to: localePath('/dashboard/uitnodigen') },
  { label: t('dash.nav.settings'), icon: 'i-lucide-settings', to: localePath('/dashboard/instellingen') },
], [
  { label: t('dash.nav.viewPage'), icon: 'i-lucide-external-link', to: customer.value ? `/r/${customer.value.slug}` : localePath('/dashboard'), target: '_blank' },
  { label: t('dash.nav.toSite'), icon: 'i-lucide-home', to: localePath('/') },
]])

const businessOptions = computed(() => (customers.value ?? []).map(c => ({ label: c.company_name || c.slug, value: c.id })))

async function logout() {
  await supabase.auth.signOut()
  await router.push(localePath('/login'))
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :min-size="15" :default-size="18">
      <template #header>
        <NuxtLink :to="localePath('/dashboard')" class="flex items-center gap-2.5 font-display font-bold">
          <Logo :size="26" /> {{ siteName }}
        </NuxtLink>
      </template>

      <template #default>
        <USelect
          v-if="businessOptions.length > 1"
          v-model="selectedId"
          :items="businessOptions"
          class="w-full mb-3"
          icon="i-lucide-store"
        />
        <div v-else-if="customer" class="flex items-center gap-2 px-1 mb-3 text-sm font-medium">
          <UIcon name="i-lucide-store" class="size-4 text-green-700" />
          <span class="truncate">{{ customer.company_name || customer.slug }}</span>
        </div>

        <UNavigationMenu :items="links" orientation="vertical" />
      </template>

      <template #footer>
        <div class="w-full">
          <div class="flex items-center gap-2.5 px-1 py-2">
            <UAvatar :alt="user?.email || 'Account'" size="sm" />
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ user?.email }}</p>
              <p class="text-xs text-muted">{{ t('dash.role') }}</p>
            </div>
          </div>
          <UButton block color="neutral" variant="ghost" icon="i-lucide-log-out" class="justify-start" @click="logout">
            {{ t('dash.logout') }}
          </UButton>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
