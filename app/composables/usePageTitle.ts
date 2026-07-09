import type { MaybeRefOrGetter } from 'vue'

/** Sets document title as "{title} — {siteName}", or just siteName when empty. */
export function usePageTitle(title?: MaybeRefOrGetter<string>) {
  const { siteName } = useSite()
  useSeoMeta({
    title: () => {
      const part = title ? String(toValue(title) || '').trim() : ''
      return part ? `${part} — ${siteName.value}` : siteName.value
    },
  })
}
