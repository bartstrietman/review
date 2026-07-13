<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { siteName } = useSite()
const { customers, customer, selectedId } = useMyBusiness()

const links = computed(() => [[
  { label: t('dash.nav.overview'), icon: 'i-lucide-layout-dashboard', to: localePath('/dashboard'), exact: true },
  { label: t('dash.widget.nav'), icon: 'i-lucide-paintbrush', to: localePath('/dashboard/widget') },
  { label: t('dash.nav.invite'), icon: 'i-lucide-mail', to: localePath('/dashboard/emails') },
  { label: t('dash.nav.settings'), icon: 'i-lucide-settings', to: localePath('/dashboard/instellingen') },
]])

const businessOptions = computed(() => (customers.value ?? []).map(c => ({ label: c.company_name || c.slug, value: c.id })))
const reviewHref = computed(() => customer.value ? `/r/${customer.value.slug}` : localePath('/dashboard'))
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

        <UNavigationMenu
          :items="links" orientation="vertical" color="primary"
          :ui="{
            link: 'data-[active]:bg-primary/10 data-[active]:text-primary data-[active]:font-semibold',
            linkLeadingIcon: 'data-[active]:text-primary',
          }"
        />
      </template>

      <template #footer>
        <NuxtLink
          :to="reviewHref" target="_blank"
          class="group w-full flex items-center gap-3 rounded-xl border border-default bg-elevated/40 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon name="i-lucide-eye" class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ t('dash.nav.viewPage') }}</span>
            <span class="block text-xs text-muted truncate">{{ t('dash.nav.viewPageHint') }}</span>
          </span>
          <UIcon name="i-lucide-external-link" class="size-4 text-muted shrink-0 transition-colors group-hover:text-primary" />
        </NuxtLink>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
