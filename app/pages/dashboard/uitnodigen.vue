<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { defaultInviteTexts, renderInviteEmail, type InviteTexts } from '~~/shared/utils/inviteEmail'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t, locale } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin
const supabase = useSupabaseClient<Database>()
const { customer, refresh: refreshCustomer } = useMyBusiness()

// Recent invites with tracking status (RLS scopes to the owner's rows).
const { data: invites, refresh: refreshInvites } = await useAsyncData(
  'dash-invites',
  async () => {
    if (!customer.value) return []
    const { data } = await supabase
      .from('invites')
      .select('id, email, status, created_at')
      .eq('customer_id', customer.value.id)
      .order('created_at', { ascending: false })
      .limit(50)
    return data ?? []
  },
  { watch: [customer] },
)

const STATUS_COLOR: Record<string, 'neutral' | 'error' | 'secondary' | 'primary'> = {
  pending: 'neutral', sent: 'neutral', failed: 'error', opened: 'secondary', completed: 'primary',
}

const emailsRaw = ref('')
const message = ref('')
const inviting = ref(false)

// ── Email text editor + live preview ────────────────────────
// Same override pattern as widget_texts: only non-empty values are stored;
// the preview renders through the exact same function as the real send.
const textsForm = reactive({ subject: '', heading: '', intro: '', buttonLabel: '', starsHint: '' })
watchEffect(() => {
  const wt = (customer.value?.invite_texts ?? {}) as InviteTexts
  Object.assign(textsForm, {
    subject: wt.subject ?? '', heading: wt.heading ?? '', intro: wt.intro ?? '',
    buttonLabel: wt.buttonLabel ?? '', starsHint: wt.starsHint ?? '',
  })
})
const textDefaults = computed(() => defaultInviteTexts(customer.value?.company_name || 'ons'))

const savingTexts = ref(false)
async function saveTexts() {
  if (!customer.value) return
  savingTexts.value = true
  const wt: Record<string, string> = {}
  for (const k of ['subject', 'heading', 'intro', 'buttonLabel', 'starsHint'] as const) {
    const v = textsForm[k].trim()
    if (v) wt[k] = v
  }
  const { error } = await supabase.from('customers').update({ invite_texts: wt }).eq('id', customer.value.id)
  savingTexts.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.invite.editor.saved'), color: 'success', icon: 'i-lucide-check' })
  await refreshCustomer()
}

const preview = computed(() => {
  const c = customer.value
  if (!c) return { subject: '', html: '' }
  return renderInviteEmail({
    company: c.company_name || 'ons',
    reviewUrl: `${origin}/r/${c.slug}`,
    texts: textsForm,
    message: message.value,
    bgColor: c.bg_color,
    textColor: c.text_color,
  })
})
const previewSrcdoc = computed(() =>
  `<!doctype html><html><body style="margin:0;padding:20px;background:#EDEDEA;font-family:Arial,sans-serif">
    <div style="background:#fff;border-radius:12px;padding:24px;max-width:480px;margin:0 auto">${preview.value.html}</div>
  </body></html>`,
)

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
    await refreshInvites()
  }
  catch (e: unknown) {
    toast.add({ title: (e as { statusMessage?: string })?.statusMessage ?? 'Versturen mislukt', color: 'error' })
  }
  finally { inviting.value = false }
}

usePageTitle('Uitnodigen')
</script>

<template>
  <UDashboardPanel id="dash-invite">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.invite')">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <p class="text-muted mb-6 max-w-2xl">{{ t('dash.invite.intro') }}</p>

        <div class="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          <div class="space-y-6">
            <UCard>
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

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <h2 class="font-semibold">{{ t('dash.invite.editor.title') }}</h2>
                  <span class="text-xs text-muted">{{ t('dash.widget.leaveEmpty') }}</span>
                </div>
              </template>
              <div class="space-y-4">
                <UFormField :label="t('dash.invite.editor.subject')">
                  <UInput v-model="textsForm.subject" class="w-full" :placeholder="textDefaults.subject" />
                </UFormField>
                <UFormField :label="t('dash.invite.editor.heading')">
                  <UInput v-model="textsForm.heading" class="w-full" :placeholder="textDefaults.heading" />
                </UFormField>
                <UFormField :label="t('dash.invite.editor.intro')">
                  <UTextarea v-model="textsForm.intro" :rows="2" autoresize class="w-full" :placeholder="textDefaults.intro" />
                </UFormField>
                <div class="grid sm:grid-cols-2 gap-4">
                  <UFormField :label="t('dash.invite.editor.button')">
                    <UInput v-model="textsForm.buttonLabel" class="w-full" :placeholder="textDefaults.buttonLabel" />
                  </UFormField>
                  <UFormField :label="t('dash.invite.editor.starsHint')">
                    <UInput v-model="textsForm.starsHint" class="w-full" :placeholder="textDefaults.starsHint" />
                  </UFormField>
                </div>
                <div class="flex justify-end">
                  <UButton color="primary" icon="i-lucide-save" :loading="savingTexts" @click="saveTexts">
                    {{ t('dash.invite.editor.save') }}
                  </UButton>
                </div>
              </div>
            </UCard>

            <div class="grid sm:grid-cols-2 gap-4 items-start">
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

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <h2 class="font-semibold">{{ t('dash.invite.history') }}</h2>
                  <span class="text-xs text-muted">{{ t('dash.invite.historyHint') }}</span>
                </div>
              </template>
              <p v-if="!invites?.length" class="text-sm text-muted">{{ t('dash.invite.historyEmpty') }}</p>
              <ul v-else class="divide-y divide-default">
                <li v-for="inv in invites" :key="inv.id" class="flex items-center justify-between gap-3 py-2.5">
                  <span class="text-sm truncate">{{ inv.email }}</span>
                  <span class="flex items-center gap-3 shrink-0">
                    <span class="text-xs text-muted">{{ relativeTime(inv.created_at, locale as 'nl' | 'en') }}</span>
                    <UBadge :color="STATUS_COLOR[inv.status] ?? 'neutral'" variant="subtle" size="sm">
                      {{ t(`dash.invite.status.${inv.status}`) }}
                    </UBadge>
                  </span>
                </li>
              </ul>
            </UCard>
          </div>

          <!-- sticky live preview: rendered by the same function as the real send -->
          <div class="lg:sticky lg:top-4">
            <p class="text-sm font-semibold mb-2">{{ t('dash.invite.editor.preview') }}</p>
            <div class="rounded-xl border border-default overflow-hidden bg-white">
              <div class="px-4 py-3 border-b border-default text-xs space-y-1">
                <p>
                  <span class="text-muted">{{ t('dash.invite.editor.previewFrom') }}: </span>
                  <strong>{{ customer?.company_name }}</strong> <span class="text-muted">(via ReviewUpgrade)</span>
                </p>
                <p class="text-muted">{{ t('dash.invite.editor.previewTo') }}: klant@voorbeeld.nl</p>
                <p class="font-semibold text-sm text-highlighted pt-1">{{ preview.subject }}</p>
              </div>
              <iframe
                :srcdoc="previewSrcdoc" sandbox="" :title="t('dash.invite.editor.preview')"
                class="w-full border-0" style="height: 540px; background: #EDEDEA"
              />
            </div>
            <p class="text-xs text-muted mt-2">{{ t('dash.invite.editor.previewNote') }}</p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
