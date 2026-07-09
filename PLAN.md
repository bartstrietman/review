# ReviewUpgrade → Nuxt-app (Cloudflare + Supabase)

## Context

`index.html` (1478 regels) is een self-contained vanilla HTML/CSS/JS-prototype voor **ReviewUpgrade**: een SaaS-widget waarmee lokale ondernemers tevreden klanten naar Google sturen en ontevreden klanten privé opvangen. Het bevat een marketing-homepage, een 5-staps aanmeldflow, subpagina's (hoe-werkt-het / FAQ / contact / bevestiging), NL/EN i18n en widget-demo-logica — alles client-side, geen backend.

We bouwen dit om tot een echte full-stack Nuxt-applicatie:
- **Nuxt 4 + Nuxt UI v4 + Tailwind v4**, huidige groen/cream/goud-huisstijl omgezet naar Nuxt UI theming.
- **Supabase** voor database + auth (**alleen e-mail-OTP, geen wachtwoorden**).
- **Cloudflare Workers** als hosting (Nitro `cloudflare_module`-preset, deploy via Wrangler).
- **Scope nu:** marketing-site + OTP-aanmelding + admin-dashboard. De embeddable klant-widget zelf komt later (de bevestigingspagina toont voorlopig de embed-code/placeholder).
- **Tweetalig** NL/EN behouden.

### Vastgelegde keuzes (uit overleg)
- Hosting: **Cloudflare Workers + Wrangler** (geen NuxtHub).
- Scope: **nu site + signup + admin**; echte widget later.
- Admin kan: aanmeldingen/klanten beheren, widget-config per klant, privé-feedback inzien, contact/leads + statistieken.
- Talen: **NL + EN**.

### Supabase-gegevens
- URL: `https://outddpbiubsqnqxzufcm.supabase.co`
- Publishable key: `sb_publishable_Y8VREQfrem6LULE5PtwfKw_TLtGuDKo`
- Service-role key: **alleen server-side, nooit in client of git** (apart instellen als Wrangler secret).

Bestaande designtokens (uit `index.html` `:root`, regels 11-17): `--green-900 #0F3D2E`, `--green-800 #15523E`, `--green-700 #1B6750`, `--cream #FAF8F3`, `--cream-dark #F1EDE3`, `--gold #E8C547`, `--gold-dark #B8962E`, `--ink #1A1A1A`, `--ink-soft #6B6B63`, `--line #E2DDD0`. Fonts: Space Grotesk (koppen) + Inter (body).

Het signup-datamodel ligt vast in de flow (`index.html` regels 1307-1409): pakket (`lokaal`/`pro`), bedrijfsnaam, straat+huisnr, postcode+plaats, telefoon (optioneel), eigen website-URL, Google-review-URL, achtergrondkleur, tekstkleur, e-mail → genereert een `slug` + embed-code.

## Tech-stack & keuzes

| Onderdeel | Keuze |
|---|---|
| Framework | Nuxt 4 (laatste), `app/`-directory structuur |
| UI | `@nuxt/ui` v4 + `tailwindcss` v4 |
| Auth + DB | `@nuxtjs/supabase` (SSR-cookies, OTP) |
| i18n | `@nuxtjs/i18n` (nl default, en) |
| Fonts | `@nuxt/fonts` (Space Grotesk + Inter) |
| Validatie | Zod via `UForm` |
| Hosting | Cloudflare Workers — Nitro `cloudflare_module` + `wrangler.jsonc` |

## 1. Project-scaffold

Nieuwe Nuxt-app in de repo-root (`index.html` blijft als referentie staan, wordt niet geserveerd).

- `nuxt.config.ts`: modules `@nuxt/ui`, `@nuxtjs/supabase`, `@nuxtjs/i18n`, `@nuxt/fonts`; `nitro.preset = 'cloudflare_module'`; `css: ['~/assets/css/main.css']`.
- `app/app.vue`: `<UApp><NuxtLayout><NuxtPage/></NuxtLayout></UApp>`.
- `wrangler.jsonc`: `compatibility_date`, `compatibility_flags: ["nodejs_compat"]`, assets-binding, `main` naar de Nitro-output.
- `.dev.vars` (lokaal) + Wrangler secrets (prod): `SUPABASE_URL`, `SUPABASE_KEY` (publishable key).

## 2. Huisstijl → Nuxt UI theming

- `app/assets/css/main.css`: `@import "tailwindcss"; @import "@nuxt/ui";` + een `@theme`-blok dat de ReviewUpgrade-tokens als custom Tailwind-kleuren registreert (een `green`-schaal 50-950 rond `#0F3D2E`, plus `gold`/`cream`/`ink`).
- `app.config.ts`: `ui.colors.primary = 'green'`, `ui.colors.neutral` = warme stone/cream-schaal; goud als secundaire/accent. Semantische utilities (`text-default`, `bg-elevated`, `border-muted`) gebruiken — geen rauwe palettkleuren.
- Fonts via `@nuxt/fonts`; koppen `font-display` (Space Grotesk), body Inter.
- Component-defaults (radius, button-stijl) afstemmen op het prototype via `app.config.ts` en waar nodig de `:ui`-prop.

## 3. Marketing-site (publieke layout)

`app/layouts/default.vue` — sticky nav (logo, links, NL/EN-`lang-toggle`, CTA) + footer.

`app/pages/index.vue` zet de homepage samen uit losse componenten in `app/components/marketing/` — één component per bestaande sectie:
`Hero.vue`, `TrustStrip.vue`, `HowItWorks.vue`, `Branches.vue` (tabs + data), `WidgetPreviews.vue`, `Demo.vue` (interactieve sterren-demo), `RoiCalculator.vue` (sliders + berekening uit regels ~1472), `Reviews.vue`, `Privacy.vue`, `Comparison.vue`, `Pricing.vue`, `Urgency.vue`, `ExitIntent.vue`.

Subpagina's: `app/pages/hoe-werkt-het.vue`, `faq.vue` (accordion via `UAccordion`), `contact.vue` (formulier → Supabase `contact_messages`).

Demo/ROI/branches-data en alle teksten verplaatsen naar i18n-locale-bestanden + een `app/data/`-module (branches, pakketten, reviews).

## 4. i18n

`@nuxtjs/i18n` met `locales: [nl, en]`, `defaultLocale: 'nl'`, strategy `prefix_except_default`. Het `T`-object (regels 711-900+) wordt omgezet naar `i18n/locales/nl.json` + `en.json`. Lang-toggle in de nav schakelt locale.

## 5. Aanmeldflow + OTP-auth

`app/pages/aanmelden.vue` — multi-step (Nuxt UI `UStepper` of eigen state), met `UForm` + Zod per stap:
1. Pakketkeuze (`lokaal`/`pro`)
2. Bedrijfsgegevens (naam, adres, telefoon, website, Google-URL)
3. Huisstijl (kleurkiezer + hex-invoer + live preview — port van `colorBlock`)
4. **E-mail + OTP** (vervangt de fake Stripe-stap): e-mail invoeren → `supabase.auth.signInWithOtp({ email })` → OTP-code invoeren → `verifyOtp`. Bij succes is de gebruiker ingelogd.
5. Na verificatie: customer-record opslaan (gekoppeld aan `auth.uid()`), `slug` genereren → redirect naar `bevestiging/[slug]`.

`app/pages/bevestiging/[slug].vue` — toont samenvatting + de twee embed-snippets (popup / vast blok), zoals `finishSignup` (regels 1392-1413). Embed-URL voorlopig placeholder (`https://reviewupgrade.nl/widget/{slug}.js`) tot de widget gebouwd is.

`app/pages/login.vue` — losse OTP-login voor terugkerende klanten/admin.

Auth-state via `useSupabaseUser()`; route-bescherming via global middleware.

## 6. Admin-dashboard

`app/layouts/admin.vue` met Nuxt UI **Dashboard**-componenten (`UDashboardGroup`/`UDashboardSidebar`/`UDashboardPanel`). Alleen toegankelijk voor admin (rolcheck — zie §7).

Pagina's onder `app/pages/admin/`:
- `index.vue` — KPI-stats (aantal aanmeldingen, leads, contactberichten).
- `klanten/index.vue` + `klanten/[id].vue` — aanmeldingen/klanten beheren (`UTable`, status bewerken, bedrijfsgegevens inzien). `[id]` toont tevens **widget-config** (kleuren, Google-URL, embed) — inzien/aanpassen.
- `feedback.vue` — privé-feedback (read-only; blijft leeg tot de widget gebouwd is, schema staat klaar).
- `leads.vue` — exit-intent leads + contactberichten.

Admin-mutaties via server-routes (`server/api/admin/*`) met de **service-role** key + server-side rolcheck, zodat RLS de UI niet hindert maar data veilig blijft.

## 7. Supabase: schema, RLS & rollen

Tabellen (`public`, RLS aan op allemaal):
- `customers` — `id, user_id (fk auth.users), slug uniek, company_name, street, postcode_city, phone, website, google_url, package, bg_color, text_color, email, status, created_at`.
- `feedback` — `id, customer_id, rating, message, created_at` (voor widget later).
- `leads` — `id, email, source, created_at` (exit-intent gids).
- `contact_messages` — `id, name, email, message, created_at`.

RLS-policies:
- `leads` / `contact_messages`: `anon` mag **insert** (publieke formulieren), alleen admin mag select.
- `customers`: ingelogde gebruiker insert/select/update **alleen eigen rij** (`auth.uid() = user_id`); admin alles.
- Admin-rol via **`app_metadata.role = 'admin'`** (NIET `user_metadata` — dat is user-editable). Admin-check in policies via `auth.jwt() -> app_metadata`. Admin-middleware leest dezelfde claim.
- Views met `security_invoker = true`; `UPDATE`-policies krijgen ook een bijbehorende `SELECT`-policy.

Schema aanmaken met `execute_sql` (MCP) tijdens iteratie; daarna `supabase db pull` voor een migratie + `get_advisors` draaien en bevindingen oplossen. TypeScript-types via `generate_typescript_types`.

## 8. Cloudflare-deploy

- `nuxt build` met `cloudflare_module`-preset → `wrangler deploy`.
- Secrets via `wrangler secret put SUPABASE_URL` / `SUPABASE_KEY` (+ service-role als secret voor server-routes).
- Custom domain later koppelen in Cloudflare.

## Kritieke bestanden

| Pad | Doel |
|---|---|
| `nuxt.config.ts`, `wrangler.jsonc`, `app/app.vue` | scaffold + Cloudflare |
| `app/assets/css/main.css`, `app.config.ts` | huisstijl → Nuxt UI |
| `app/layouts/default.vue`, `admin.vue` | publieke + admin layout |
| `app/pages/index.vue` + `app/components/marketing/*` | homepage-secties |
| `app/pages/aanmelden.vue`, `bevestiging/[slug].vue`, `login.vue` | signup + OTP |
| `app/pages/admin/*`, `server/api/admin/*` | dashboard |
| `app/middleware/*` | auth/admin-bescherming |
| `i18n/locales/{nl,en}.json` | vertalingen |
| Supabase-migratie | schema + RLS |

## Verificatie

1. `pnpm dev` — homepage rendert met juiste huisstijl, alle secties + NL/EN-toggle werken.
2. Aanmeldflow doorlopen → OTP-mail ontvangen → code invoeren → `customers`-rij verschijnt in Supabase → bevestigingspagina toont embed-code.
3. Contact- en exit-intent-formulier → rij in `contact_messages` / `leads`.
4. Inloggen met admin-e-mail (rol `app_metadata.role=admin`) → `/admin` toegankelijk; niet-admin krijgt redirect.
5. Admin ziet aanmeldingen/leads/contact + KPI's; niet-ingelogde of niet-admin geblokkeerd.
6. `get_advisors` (security + performance) zonder openstaande issues.
7. `wrangler dev` lokaal als Worker; daarna `wrangler deploy` → smoke-test op de Workers-URL (SSR + auth-cookies werken).

## Openstaande aandachtspunten

- **Privé-feedback** in admin blijft leeg tot de embeddable widget gebouwd wordt (aparte vervolgfase); schema + admin-view staan dan al klaar.
- **Betaling** (Stripe) bewust buiten scope; stap 4 is nu puur e-mail/OTP.
- E-mailafzender voor OTP loopt via Supabase' default mail (later eigen SMTP/domein voor betrouwbaarheid).

## Volgorde van bouwen (suggestie)
1. Scaffold + Cloudflare-config + draaiende lege app.
2. Huisstijl/theming + layout + nav/footer.
3. Marketing-homepage secties + subpagina's + i18n.
4. Supabase-schema + RLS + types.
5. Aanmeldflow + OTP-auth + bevestiging.
6. Admin-dashboard + server-routes.
7. Deploy naar Cloudflare + end-to-end test.
