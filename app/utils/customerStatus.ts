export function statusColor(s: string) {
  return s === 'active' ? 'success' : s === 'trial' ? 'primary' : s === 'paused' ? 'warning' : 'neutral'
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL')
}
