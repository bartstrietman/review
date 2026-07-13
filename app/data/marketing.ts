export const COLOR_PALETTE = [
  '#0F3D2E', '#15523E', '#1B6750', '#1A56A0', '#072539', '#0C447C',
  '#534AB7', '#3C3489', '#993C1D', '#D85A30', '#993556', '#D4537E',
  '#B8962E', '#E8C547', '#444441', '#1A1A1A', '#FFFFFF', '#FAF8F3',
]

export interface WidgetStyle { bg: string; fg: string; biz: Record<'nl' | 'en', string> }

export const WIDGET_STYLES: WidgetStyle[] = [
  { bg: '#0F3D2E', fg: '#FFFFFF', biz: { nl: 'Loodgietersbedrijf Van Dijk', en: 'Van Dijk Plumbing' } },
  { bg: '#1A56A0', fg: '#FFFFFF', biz: { nl: 'Kapsalon Anna', en: "Anna's Salon" } },
  { bg: '#FAF8F3', fg: '#1A1A1A', biz: { nl: 'Bakker Fysiotherapie', en: 'Bakker Physiotherapy' } },
]

// Testimonials: author name + avatar initials + i18n text keys (from prototype)
export const TESTIMONIALS = [
  { name: 'Mark de Vries', initials: 'MD', key: '1' },
  { name: 'Anna Kuiper', initials: 'AK', key: '2' },
  { name: 'Rik Bakker', initials: 'RB', key: '3' },
]

// Single plan. `id` is the customers.package DB value ('lokaal' is historic —
// the check constraint also still allows 'pro' for legacy rows).
export const PRICING_PLAN = {
  id: 'lokaal' as const,
  price: '€19,99',
  priceCents: 1999,
  featureKeys: ['f1', 'f2', 'f3', 'f4'],
}

export function slugify(name: string): string {
  return (name || 'business')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'business'
}
