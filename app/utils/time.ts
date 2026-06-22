/** Human-friendly relative time, falling back to a date for older items. */
export function relativeTime(input: string | Date, locale: 'nl' | 'en' = 'nl'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = Date.now() - d.getTime()
  const sec = Math.round(diff / 1000)
  const min = Math.round(sec / 60)
  const hour = Math.round(min / 60)
  const day = Math.round(hour / 24)

  const nl = {
    now: 'zojuist', min: (n: number) => `${n} min geleden`, hour: (n: number) => `${n} uur geleden`,
    yesterday: 'gisteren', days: (n: number) => `${n} dagen geleden`,
  }
  const en = {
    now: 'just now', min: (n: number) => `${n} min ago`, hour: (n: number) => `${n}h ago`,
    yesterday: 'yesterday', days: (n: number) => `${n} days ago`,
  }
  const w = locale === 'en' ? en : nl

  if (sec < 45) return w.now
  if (min < 60) return w.min(min)
  if (hour < 24) return w.hour(hour)
  if (day === 1) return w.yesterday
  if (day < 7) return w.days(day)
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
