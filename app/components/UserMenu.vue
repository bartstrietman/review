<script setup lang="ts">
// Account + logout, shown top-right in the dashboard navbar.
const { t } = useI18n()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const localePath = useLocalePath()
const router = useRouter()
const { customer } = useMyBusiness()

async function logout() {
  await supabase.auth.signOut()
  await router.push(localePath('/login'))
}

const items = computed(() => [
  [{ label: user.value?.email ?? '', type: 'label' as const }],
  [{ label: t('dash.role'), icon: 'i-lucide-store', type: 'label' as const }],
  [{
    label: t('dash.nav.viewPage'),
    icon: 'i-lucide-external-link',
    to: customer.value ? `/r/${customer.value.slug}` : localePath('/dashboard'),
    target: '_blank',
  }],
  [{ label: t('dash.logout'), icon: 'i-lucide-log-out', onSelect: () => logout() }],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }" :ui="{ content: 'w-60' }">
    <UButton color="neutral" variant="ghost" size="sm" class="gap-2">
      <UAvatar :alt="user?.email || 'Account'" size="2xs" />
      <span class="hidden sm:inline text-sm font-medium max-w-40 truncate">{{ user?.email }}</span>
      <UIcon name="i-lucide-chevron-down" class="size-4 text-dimmed" />
    </UButton>
  </UDropdownMenu>
</template>
