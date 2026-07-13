// Shared invite-email template: the server (send) and the dashboard (preview)
// render through this same function, so the preview always matches what's sent.
// Layout follows design exploration A ("Minimaal") + clickable star row: each
// star deep-links to the review page with ?score=N preselected.

export interface InviteTexts {
  subject?: string
  heading?: string
  intro?: string
  buttonLabel?: string
  starsHint?: string
}

export function defaultInviteTexts(company: string): Required<InviteTexts> {
  return {
    subject: `Laat een review achter voor ${company}`,
    heading: `Laat een review achter voor ${company}`,
    intro: 'Je wordt uitgenodigd om je ervaring te delen. Het duurt minder dan een minuut.',
    buttonLabel: 'Geef je beoordeling',
    starsHint: 'Het zou ons enorm helpen als je een 5-sterrenreview achterlaat — zo gaan we vooruit.',
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))
}

function safeHex(v: string | null | undefined, fallback: string) {
  return v && /^#[0-9a-f]{3,8}$/i.test(v) ? v : fallback
}

export function renderInviteEmail(opts: {
  company: string
  reviewUrl: string
  texts?: InviteTexts | null
  message?: string
  pixelUrl?: string
  bgColor?: string | null
  textColor?: string | null
}): { subject: string; html: string } {
  const d = defaultInviteTexts(opts.company)
  const t = opts.texts ?? {}
  const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback)

  const subject = pick(t.subject, d.subject)
  const heading = pick(t.heading, d.heading)
  const intro = pick(t.intro, d.intro)
  const buttonLabel = pick(t.buttonLabel, d.buttonLabel)
  const starsHint = pick(t.starsHint, d.starsHint)
  const bg = safeHex(opts.bgColor, '#0F3D2E')
  const fg = safeHex(opts.textColor, '#FFFFFF')

  // Personal message: quiet block with an accent bar so it doesn't drown
  // between the standard texts (design exploration A).
  const messageBlock = opts.message?.trim()
    ? `<div style="border-left:3px solid ${bg};background:#F6F6F4;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0">
        <p style="margin:0;color:#444;white-space:pre-wrap">${escapeHtml(opts.message.trim())}</p>
      </div>`
    : ''

  // Star row: each star opens the review page with that score preselected.
  const starUrl = (n: number) => `${opts.reviewUrl}${opts.reviewUrl.includes('?') ? '&' : '?'}score=${n}`
  const stars = [1, 2, 3, 4, 5]
    .map(n => `<a href="${starUrl(n)}" style="text-decoration:none;font-size:32px;line-height:1;color:#E8C547;padding:0 3px" aria-label="${n} sterren">&#9733;</a>`)
    .join('')

  const pixel = opts.pixelUrl
    ? `<img src="${opts.pixelUrl}" width="1" height="1" alt="" style="display:none" />`
    : ''

  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;max-width:480px">
      ${messageBlock}
      <h2 style="color:${bg}">${escapeHtml(heading)}</h2>
      <p style="color:#6B6B63;white-space:pre-wrap">${escapeHtml(intro)}</p>
      <p style="margin:22px 0 4px;font-weight:600;font-size:15px">Hoe was je ervaring? Klik op een ster:</p>
      <p style="margin:0 0 6px">${stars}</p>
      <p style="color:#6B6B63;font-size:13px;margin:0 0 4px">${escapeHtml(starsHint)}</p>
      <p style="margin:24px 0">
        <a href="${opts.reviewUrl}" style="background:${bg};color:${fg};text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(buttonLabel)}</a>
      </p>
      <p style="color:#9a958a;font-size:12px">Of open: ${opts.reviewUrl}</p>
      ${pixel}
    </div>`

  return { subject, html }
}
