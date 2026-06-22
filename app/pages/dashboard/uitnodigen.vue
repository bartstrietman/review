<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin
const { customer } = useMyBusiness()

const emailsRaw = ref('')
const message = ref('')
const inviting = ref(false)

const parsedEmails = computed(() =>
  emailsRaw.value.split(/[\s,;]+/).map(e => e.trim()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)),
)
const reviewUrl = computed(() => customer.value ? `${origin}/r/${customer.value.slug}` : '')

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.add({ title: 'Gekopieerd', color: 'success', icon: 'i-lucide-check' }) }
  catch { toast.add({ title: 'Kon niet kopiëren', color: 'error' }) }
}

async function send() {
  if (!customer.value || !parsedEmails.value.length) {
    toast.add({ title: 'Vul minstens één geldig e-mailadres in.', color: 'error' }); return
  }
  inviting.value = true
  try {
    const res = await $fetch<{ sent: number; failed: string[] }>('/api/invite', {
      method: 'POST',
      body: { slug: customer.value.slug, emails: parsedEmails.value, message: message.value },
    })
    if (res.sent > 0) {
      toast.add({ title: `${res.sent} uitnodiging${res.sent === 1 ? '' : 'en'} verstuurd`, color: 'success', icon: 'i-lucide-send' })
      emailsRaw.value = ''; message.value = ''
    }
    if (res.failed?.length) toast.add({ title: `${res.failed.length} mislukt`, description: res.failed.join(', '), color: 'warning' })
  }
  catch (e: unknown) {
    toast.add({ title: (e as { statusMessage?: string })?.statusMessage ?? 'Versturen mislukt', color: 'error' })
  }
  finally { inviting.value = false }
}

useSeoMeta({ title: 'Uitnodigen — ReviewShield' })
</script>

<template>
  <UDashboardPanel id="dash-invite">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.invite')">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl">
        <p class="text-muted mb-6">{{ t('dash.invite.intro') }}</p>

        <div class="grid lg:grid-cols-3 gap-6">
          <UCard class="lg:col-span-2">
            <template #header><h2 class="font-semibold">{{ t('dash.invite.send') }}</h2></template>
            <UFormField :label="t('dash.invite.emails')" :help="t('dash.invite.emailsHelp')">
              <UTextarea v-model="emailsRaw" :rows="4" autoresize class="w-full" placeholder="klant1@mail.nl, klant2@mail.nl" />
            </UFormField>
            <UFormField :label="t('dash.invite.msg')" class="mt-4" :help="t('dash.invite.msgHelp')">
              <UTextarea v-model="message" :rows="3" autoresize class="w-full" placeholder="Bedankt voor je bezoek! We horen graag wat je ervan vond." />
            </UFormField>
            <div class="flex items-center justify-between mt-5">
              <span class="text-sm text-muted">{{ parsedEmails.length }} {{ parsedEmails.length === 1 ? t('dash.invite.valid') : t('dash.invite.validP') }}</span>
              <UButton color="primary" icon="i-lucide-send" :loading="inviting" :disabled="!parsedEmails.length" @click="send">
                {{ t('dash.invite.send') }}
              </UButton>
            </div>
          </UCard>

          <div class="space-y-4">
            <UCard>
              <template #header><h2 class="font-semibold text-sm">{{ t('dash.invite.share') }}</h2></template>
              <p class="text-xs text-muted mb-3">{{ t('dash.invite.shareHint') }}</p>
              <div class="flex gap-2 mb-3">
                <UInput :model-value="reviewUrl" readonly class="flex-1 font-mono text-[11px]" :aria-label="t('dash.link.label')" />
                <UButton icon="i-lucide-copy" color="primary" size="sm" :aria-label="t('dash.link.copy')" @click="copy(reviewUrl)" />
              </div>
              <QrCode :value="reviewUrl" :size="128" />
            </UCard>
            <UAlert
              color="neutral" variant="soft" icon="i-lucide-info"
              :title="t('dash.invite.tip')"
              :description="t('dash.invite.tipBody')"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
