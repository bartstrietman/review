// Pull the customer's email address out of a forwarded message.
// The business owner forwards a customer email to their inbox address; we take
// the most likely "customer" address and skip their own / system addresses.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

// Addresses that are never a real customer to invite.
const BLOCK_PATTERNS = [
  /no-?reply/i, /do-?not-?reply/i, /donotreply/i, /mailer-daemon/i,
  /postmaster/i, /bounce/i, /notification/i, /automated?@/i, /@resend\./i,
]

export interface ExtractInput {
  subject?: string | null
  text?: string | null
  replyTo?: string | null
  from?: string | null // the forwarder (owner) — excluded
  blockDomains?: string[] // e.g. ['reviewupgrade.nl', 'invite.reviewupgrade.nl']
}

// Extract just the address from a display form like `Jan <jan@x.nl>` or a raw list.
function isBlocked(email: string, own: string, blockDomains: string[]): boolean {
  const e = email.toLowerCase()
  if (e === own) return true
  if (BLOCK_PATTERNS.some(re => re.test(e))) return true
  const domain = e.split('@')[1] ?? ''
  return blockDomains.some(bd => domain === bd || domain.endsWith('.' + bd))
}

function firstUsable(s: string | null | undefined, own: string, blockDomains: string[]): string | null {
  if (!s) return null
  for (const m of s.matchAll(EMAIL_RE)) {
    if (!isBlocked(m[0], own, blockDomains)) return m[0].toLowerCase()
  }
  return null
}

export function extractInviteEmail(input: ExtractInput): string | null {
  const own = (input.from ?? '').toLowerCase().match(EMAIL_RE)?.[0] ?? (input.from ?? '').toLowerCase().trim()
  const blockDomains = (input.blockDomains ?? []).map(d => d.toLowerCase())
  const text = input.text ?? ''

  // 1) Owner typed the address in the subject → explicit intent, wins.
  const fromSubject = firstUsable(input.subject, own, blockDomains)
  if (fromSubject) return fromSubject

  // 2) The original sender in a forwarded block ("From:" / "Van:").
  const fromLine = text.split(/\r?\n/).find(l => /^\s*(from|van)\s*:/i.test(l))
  const fromLineEmail = firstUsable(fromLine, own, blockDomains)
  if (fromLineEmail) return fromLineEmail

  // 3) Fall back to the first usable address anywhere in the body, then reply-to.
  return firstUsable(text, own, blockDomains) ?? firstUsable(input.replyTo, own, blockDomains)
}
