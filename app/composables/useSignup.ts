export interface SignupData {
  pakket: 'lokaal' | 'pro'
  bedrijfsnaam: string
  straatHuisnummer: string
  postcodePlaats: string
  telefoon: string
  eigenSite: string
  googleUrl: string
  achtergrondkleur: string
  tekstkleur: string
  email: string
}

export function useSignup() {
  // Persisted across the OTP round-trip within the session.
  return useState<SignupData>('signup', () => ({
    pakket: 'lokaal',
    bedrijfsnaam: '',
    straatHuisnummer: '',
    postcodePlaats: '',
    telefoon: '',
    eigenSite: '',
    googleUrl: '',
    achtergrondkleur: '#0F3D2E',
    tekstkleur: '#FFFFFF',
    email: '',
  }))
}
