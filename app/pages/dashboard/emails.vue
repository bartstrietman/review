<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { defaultInviteTexts, type InviteTexts } from '~~/shared/utils/inviteEmail'

definePageMeta({ layout: 'customer', middleware: 'auth' })

const { t, locale } = useI18n()
const toast = useToast()
const origin = useRequestURL().origin
const supabase = useSupabaseClient<Database>()
const { customer, refresh: refreshCustomer } = useMyBusiness()

const tab = ref<'compose' | 'sent'>('compose')

// Sent invites with tracking status (RLS scopes to the owner's rows).
const { data: invites, refresh: refreshInvites } = await useAsyncData(
  'dash-invites',
  async () => {
    if (!customer.value) return []
    const { data } = await supabase
      .from('invites')
      .select('id, email, status, created_at')
      .eq('customer_id', customer.value.id)
      .order('created_at', { ascending: false })
      .limit(200)
    return data ?? []
  },
  { watch: [customer] },
)

const STATUS_COLOR: Record<string, 'neutral' | 'error' | 'secondary' | 'primary'> = {
  pending: 'neutral', sent: 'neutral', failed: 'error', opened: 'secondary', completed: 'primary',
}
const counts = computed(() => {
  const c = { total: 0, opened: 0, completed: 0 }
  for (const inv of invites.value ?? []) {
    c.total++
    if (inv.status === 'opened') c.opened++
    if (inv.status === 'completed') c.completed++
  }
  return c
})

const emailsRaw = ref('')
const message = ref(t('dash.invite.msgExample')) // prefilled example — editable/clearable
const inviting = ref(false)

// ── Inline email text overrides ─────────────────────────────
// Same override pattern as widget_texts: only non-empty values are stored;
// empty falls back to the default. The real send renders through
// renderInviteEmail with these same values.
const textsForm = reactive({ subject: '', heading: '', intro: '', starsQuestion: '', buttonLabel: '', starsHint: '' })
const TEXT_KEYS = ['subject', 'heading', 'intro', 'starsQuestion', 'buttonLabel', 'starsHint'] as const
watchEffect(() => {
  const wt = (customer.value?.invite_texts ?? {}) as InviteTexts
  Object.assign(textsForm, {
    subject: wt.subject ?? '', heading: wt.heading ?? '', intro: wt.intro ?? '',
    starsQuestion: wt.starsQuestion ?? '', buttonLabel: wt.buttonLabel ?? '', starsHint: wt.starsHint ?? '',
  })
})
const textDefaults = computed(() => defaultInviteTexts(customer.value?.company_name || 'ons'))

// Brand colours (mirror renderInviteEmail's safeHex fallbacks).
const safeHex = (v: string | null | undefined, fb: string) => (v && /^#[0-9a-f]{3,8}$/i.test(v) ? v : fb)
const bg = computed(() => safeHex(customer.value?.bg_color, '#0F3D2E'))
const fg = computed(() => safeHex(customer.value?.text_color, '#FFFFFF'))

const textsDirty = computed(() =>
  TEXT_KEYS.some(k => textsForm[k].trim() !== ((customer.value?.invite_texts as InviteTexts)?.[k] ?? '')),
)
const savingTexts = ref(false)
async function saveTexts() {
  if (!customer.value) return
  savingTexts.value = true
  const wt: Record<string, string> = {}
  for (const k of TEXT_KEYS) {
    const v = textsForm[k].trim()
    if (v) wt[k] = v
  }
  const { error } = await supabase.from('customers').update({ invite_texts: wt }).eq('id', customer.value.id)
  savingTexts.value = false
  if (error) { toast.add({ title: error.message, color: 'error' }); return }
  toast.add({ title: t('dash.invite.editor.saved'), color: 'success', icon: 'i-lucide-check' })
  await refreshCustomer()
}

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
      emailsRaw.value = ''; message.value = t('dash.invite.msgExample')
    }
    if (res.failed?.length) toast.add({ title: `${res.failed.length} mislukt`, description: res.failed.join(', '), color: 'warning' })
    await refreshInvites()
  }
  catch (e: unknown) {
    toast.add({ title: (e as { statusMessage?: string })?.statusMessage ?? 'Versturen mislukt', color: 'error' })
  }
  finally { inviting.value = false }
}

usePageTitle('E-mails')
</script>

<template>
  <UDashboardPanel id="dash-invite">
    <template #header>
      <UDashboardNavbar :title="t('dash.nav.invite')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right><UserMenu /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl mx-auto w-full">
        <!-- Tab switcher: compose the email · view who was invited -->
        <div class="inline-flex items-center gap-1 rounded-full border border-default bg-elevated/40 p-1 mb-6">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            :class="tab === 'compose' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-default'"
            @click="tab = 'compose'"
          >
            <UIcon name="i-lucide-send" class="size-4" /> {{ t('dash.invite.compose') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            :class="tab === 'sent' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-default'"
            @click="tab = 'sent'"
          >
            <UIcon name="i-lucide-mail-check" class="size-4" /> {{ t('dash.nav.sent') }}
            <UBadge
              v-if="counts.total" size="sm" variant="subtle"
              :color="tab === 'sent' ? 'neutral' : 'primary'"
            >
              {{ counts.total }}
            </UBadge>
          </button>
        </div>

        <!-- ── Compose: the email itself is the screen ── -->
        <div v-show="tab === 'compose'" class="space-y-8">
          <UCard>
            <template #header>
              <h1 class="text-xl font-semibold">{{ t('dash.invite.compose') }}</h1>
              <p class="text-muted text-sm mt-1">{{ t('dash.invite.composeSub') }}</p>
            </template>

            <!-- Envelope: to / subject / from -->
            <div class="divide-y divide-default text-sm">
              <label class="flex items-baseline gap-3 py-3">
                <span class="text-muted w-20 shrink-0">{{ t('dash.invite.editor.previewTo') }}</span>
                <textarea
                  v-model="emailsRaw" rows="1" :placeholder="t('dash.invite.toPlaceholder')"
                  class="block w-full rounded-lg border border-default bg-elevated/40 px-3 py-2 text-default outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  style="field-sizing:content;resize:none"
                />
              </label>
              <div class="flex items-baseline gap-3 py-3">
                <span class="text-muted w-20 shrink-0 pt-0.5">{{ t('dash.invite.editor.subject') }}</span>
                <EditableText
                  v-model="textsForm.subject" :fallback="textDefaults.subject"
                  :label="t('dash.invite.editor.subject')" :maxlength="90"
                  text-class="font-semibold text-default"
                />
              </div>
              <div class="flex items-baseline gap-3 py-3">
                <span class="text-muted w-20 shrink-0">{{ t('dash.invite.editor.previewFrom') }}</span>
                <span><strong>{{ customer?.company_name }}</strong> <span class="text-muted">(via ReviewUpgrade)</span></span>
              </div>
            </div>

            <!-- Email body — click any text to edit it in place -->
            <div class="mt-5 rounded-xl bg-white border border-default p-6 sm:p-7 shadow-sm text-[#1A1A1A]">
              <!-- personal message: quiet accent block, matches renderInviteEmail -->
              <div class="rounded-r-lg mb-5 pl-3 py-2" :style="{ borderLeft: `3px solid ${bg}`, background: '#F6F6F4' }">
                <EditableText
                  v-model="message" :placeholder="t('dash.invite.msgPlaceholder')"
                  :label="t('dash.invite.msgLabel')" :maxlength="300" multiline
                  text-class="text-[15px] italic text-[#333]"
                />
              </div>

              <EditableText
                v-model="textsForm.heading" :fallback="textDefaults.heading"
                :label="t('dash.invite.editor.heading')" :maxlength="90" wrap
                text-class="text-2xl font-bold leading-tight" :text-style="{ color: bg }"
              />
              <div class="mt-3">
                <EditableText
                  v-model="textsForm.intro" :fallback="textDefaults.intro"
                  :label="t('dash.invite.editor.intro')" :maxlength="220" multiline
                  text-class="text-[15px] text-[#333]"
                />
              </div>

              <div class="mt-6 mb-1">
                <EditableText
                  v-model="textsForm.starsQuestion" :fallback="textDefaults.starsQuestion"
                  :label="t('dash.invite.editor.starsQuestion')" :maxlength="80" wrap
                  text-class="font-semibold text-[15px]"
                />
              </div>
              <p class="text-[26px] leading-none tracking-wide mb-2" style="color:#E8C547">★★★★★</p>
              <EditableText
                v-model="textsForm.starsHint" :fallback="textDefaults.starsHint"
                :label="t('dash.invite.editor.starsHint')" :maxlength="180" multiline
                text-class="text-[13px] text-[#555]"
              />

              <div class="my-6">
                <div class="inline-flex rounded-lg font-semibold px-4 py-3" :style="{ background: bg, color: fg }">
                  <EditableText
                    v-model="textsForm.buttonLabel" :fallback="textDefaults.buttonLabel"
                    :label="t('dash.invite.editor.button')" :maxlength="40"
                    text-class="font-semibold" :text-style="{ color: fg }"
                  />
                </div>
              </div>

              <p class="text-xs" style="color:#9a958a">Of open: {{ reviewUrl }}</p>
            </div>

            <template #footer>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-3 text-sm text-muted min-w-0">
                  <span class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-shield-check" class="size-4" />{{ t('dash.invite.brandNote') }}
                  </span>
                  <span>·</span>
                  <span>{{ parsedEmails.length }} {{ parsedEmails.length === 1 ? t('dash.invite.valid') : t('dash.invite.validP') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="textsDirty" color="neutral" variant="ghost" size="sm"
                    icon="i-lucide-save" :loading="savingTexts" @click="saveTexts"
                  >
                    {{ t('dash.invite.editor.save') }}
                  </UButton>
                  <UButton color="primary" icon="i-lucide-send" :loading="inviting" :disabled="!parsedEmails.length" @click="send">
                    {{ t('dash.invite.send') }}
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>

          <!-- Alternative: share the link / QR yourself -->
          <UCard>
            <template #header><h2 class="font-semibold text-sm">{{ t('dash.invite.share') }}</h2></template>
            <p class="text-xs text-muted mb-3">{{ t('dash.invite.shareHint') }}</p>
            <div class="flex gap-2 mb-3 max-w-sm">
              <UInput :model-value="reviewUrl" readonly class="flex-1 font-mono text-[11px]" :aria-label="t('dash.link.label')" />
              <UButton icon="i-lucide-copy" color="primary" size="sm" :aria-label="t('dash.link.copy')" @click="copy(reviewUrl)" />
            </div>
            <QrCode :value="reviewUrl" :size="128" />
          </UCard>
        </div>

        <!-- ── Sent: who was invited ── -->
        <div v-show="tab === 'sent'" class="space-y-6">
          <p class="text-muted text-sm">{{ t('dash.invite.historyHint') }}</p>

          <div v-if="counts.total" class="grid grid-cols-3 gap-4">
            <UCard>
              <p class="text-2xl font-bold">{{ counts.total }}</p>
              <p class="text-xs text-muted">{{ t('dash.invite.history') }}</p>
            </UCard>
            <UCard>
              <p class="text-2xl font-bold">{{ counts.opened }}</p>
              <p class="text-xs text-muted">{{ t('dash.invite.status.opened') }}</p>
            </UCard>
            <UCard>
              <p class="text-2xl font-bold">{{ counts.completed }}</p>
              <p class="text-xs text-muted">{{ t('dash.invite.status.completed') }}</p>
            </UCard>
          </div>

          <UCard>
            <template #header><h2 class="font-semibold">{{ t('dash.invite.history') }}</h2></template>

            <div v-if="!invites?.length" class="py-10 text-center">
              <UIcon name="i-lucide-mail-plus" class="size-8 text-muted mx-auto mb-3" />
              <p class="text-sm text-muted mb-4">{{ t('dash.invite.historyEmpty') }}</p>
              <UButton icon="i-lucide-send" color="primary" @click="tab = 'compose'">
                {{ t('dash.invite.compose') }}
              </UButton>
            </div>

            <ul v-else class="divide-y divide-default">
              <li v-for="inv in invites" :key="inv.id" class="flex items-center justify-between gap-3 py-3">
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
      </div>
    </template>
  </UDashboardPanel>
</template>
