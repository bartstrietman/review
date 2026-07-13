// Thin wrappers around the Resend HTTP API (shared by outbound + inbound flows).

export function resendSend(
  cfg: { resendKey: string, resendFrom: string },
  msg: { to: string | string[], subject: string, html: string, replyTo?: string },
) {
  return $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
    body: { from: cfg.resendFrom, to: msg.to, subject: msg.subject, html: msg.html, reply_to: msg.replyTo },
  })
}

// Inbound webhooks carry only metadata; fetch the full parsed message by id.
export function resendGetReceived(cfg: { resendKey: string }, id: string) {
  return $fetch<{ subject?: string, text?: string, html?: string, from?: string, to?: string[], reply_to?: string }>(
    `https://api.resend.com/emails/receiving/${id}`,
    { headers: { Authorization: `Bearer ${cfg.resendKey}` } },
  )
}

// Verify a Svix-signed Resend webhook. Returns true when the signature matches.
export async function verifyResendWebhook(
  secret: string,
  headers: { id?: string, timestamp?: string, signature?: string },
  rawBody: string,
): Promise<boolean> {
  const { id, timestamp, signature } = headers
  if (!secret || !id || !timestamp || !signature) return false
  const keyB64 = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
  // ponytail: non-constant-time compare; fine for a signed webhook, the expected value is derived per-request.
  return signature.split(' ').some(part => part.split(',')[1] === expected)
}
