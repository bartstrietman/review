import type { Database } from '~/types/database.types'
import { slugify } from '~/data/marketing'

export interface SignupData {
  pakket: 'lokaal' | 'pro'
  bedrijfsnaam: string
  straatHuisnummer: string
  postcode: string
  plaats: string
  telefoon: string
  eigenSite: string
  googleUrl: string
  googlePlaceId: string
  achtergrondkleur: string
  tekstkleur: string
  email: string
}

const STORAGE_KEY = 'rs_signup'

function defaults(): SignupData {
  return {
    pakket: 'lokaal',
    bedrijfsnaam: '',
    straatHuisnummer: '',
    postcode: '',
    plaats: '',
    telefoon: '',
    eigenSite: '',
    googleUrl: '',
    googlePlaceId: '',
    achtergrondkleur: '#0F3D2E',
    tekstkleur: '#FFFFFF',
    email: '',
  }
}

export function useSignup() {
  const data = useState<SignupData>('signup', defaults)
  const hydrated = useState('signup_hydrated', () => false)

  // Persist across the magic-link round-trip (new tab / page reload).
  if (import.meta.client && !hydrated.value) {
    hydrated.value = true
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) Object.assign(data.value, JSON.parse(saved))
    }
    catch { /* ignore */ }
    watch(data, (v) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) }
      catch { /* ignore */ }
    }, { deep: true })
  }

  function clear() {
    if (import.meta.client) {
      try { localStorage.removeItem(STORAGE_KEY) }
      catch { /* ignore */ }
    }
    Object.assign(data.value, defaults())
  }

  return { data, clear }
}

/** Inserts the customer under the signed-in user's session (RLS: user_id = auth.uid()). */
export function useSaveCustomer() {
  const supabase = useSupabaseClient<Database>()

  return async (d: SignupData, userId: string): Promise<string> => {
    const base = slugify(d.bedrijfsnaam)
    const payload = {
      user_id: userId,
      company_name: d.bedrijfsnaam,
      street: d.straatHuisnummer || null,
      postcode: d.postcode || null,
      city: d.plaats || null,
      phone: d.telefoon || null,
      website: d.eigenSite || null,
      google_url: d.googleUrl || null,
      google_place_id: d.googlePlaceId || null,
      package: d.pakket,
      bg_color: d.achtergrondkleur,
      text_color: d.tekstkleur,
      email: d.email,
      status: 'trial' as const,
    }

    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
      const { data: row, error } = await supabase
        .from('customers')
        .insert({ ...payload, slug })
        .select('slug')
        .single()
      if (!error && row) return row.slug
      if (error && error.code !== '23505') throw new Error(error.message)
    }
    throw new Error('Kon geen unieke slug genereren')
  }
}
