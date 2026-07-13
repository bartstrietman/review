<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const localePath = useLocalePath()
const router = useRouter()
const { siteName } = useSite()

const links = computed(() => [[
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: localePath('/admin'), exact: true },
  { label: 'Klanten', icon: 'i-lucide-users', to: localePath('/admin/klanten') },
  { label: 'Klant toevoegen', icon: 'i-lucide-user-plus', to: localePath('/admin/klanten/nieuw') },
], [
  { label: 'Naar website', icon: 'i-lucide-external-link', to: localePath('/') },
]])

async function logout() {
  await supabase.auth.signOut()
  await router.push(localePath('/login'))
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :min-size="14" :default-size="17">
      <template #header>
        <NuxtLink :to="localePath('/admin')" class="flex items-center gap-2.5 font-display font-bold">
          <Logo :size="26" /> {{ siteName }}
        </NuxtLink>
      </template>

      <template #default>
        <UNavigationMenu :items="links" orientation="vertical" />
      </template>

      <template #footer>
        <div class="w-full">
          <div class="flex items-center gap-2.5 px-1 py-2">
            <UAvatar :alt="user?.email || 'Admin'" size="sm" />
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ user?.email }}</p>
              <p class="text-xs text-muted">Admin</p>
            </div>
          </div>
          <UButton block color="neutral" variant="ghost" icon="i-lucide-log-out" class="justify-start" @click="logout">
            Uitloggen
          </UButton>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
