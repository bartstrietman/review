# ReviewUpgrade — deploy & runtime

Nuxt 4 + Nuxt UI v4 + Supabase, gehost als **Cloudflare Worker** (Nitro
`cloudflare_module`-preset). Lokale dev draait op **poort 2001**.

## Lokaal ontwikkelen

```bash
pnpm install
pnpm dev            # http://localhost:2001
```

Env staat in `.env` (gitignored). De Supabase-MCP-token zit in je shell
(`~/.zshrc`). Zie `CLAUDE.md`.

## Productie-build + Cloudflare-deploy

```bash
# 1. Build met de cloudflare_module preset
pnpm build

# 2. Lokale Worker-smoke-test (workerd) — vanuit .output/server
cd .output/server && npx wrangler dev --port 2002

# 3. Deploy (vereist `wrangler login` met je Cloudflare-account)
npx wrangler --cwd .output deploy
```

> De Nitro-preset genereert `.output/server/wrangler.json` uit de root
> `wrangler.jsonc`; `main`/`assets` worden door de preset overschreven (verwacht).

### Secrets (productie)

Zet als Wrangler-secrets — **niet** in git:

```bash
npx wrangler secret put SUPABASE_URL          # https://outddpbiubsqnqxzufcm.supabase.co
npx wrangler secret put SUPABASE_KEY          # sb_publishable_... (publishable/anon key)
# Optioneel, alleen als je later server-side admin-acties met service-role wilt:
npx wrangler secret put SUPABASE_SERVICE_KEY
```

**Resend (review-uitnodigingen + account-activatiemail):** Nuxt leest de
runtime-config `resendKey`/`resendFrom` runtime uit `NUXT_`-secrets. Het
`from`-adres moet op een in Resend **geverifieerd** domein staan
(`reviewupgrade.nl` is geverifieerd):

```bash
npx wrangler secret put NUXT_RESEND_KEY       # re_... (Resend API key)
npx wrangler secret put NUXT_RESEND_FROM      # ReviewUpgrade <noreply@reviewupgrade.nl>
```

**Serper (bedrijf-zoeken bij aanmelden):** de key `SERPER_KEY` staat in `.env`
(server-only, gitignored) en wordt bij `pnpm build` in de server-bundle gebakken
(niet in de client). Bij **git-based CI-deploys** zet je 'm als Worker-secret:
`npx wrangler secret put NUXT_SERPER_KEY` (Nuxt leest `NUXT_SERPER_KEY` runtime).

`SUPABASE_KEY` is de **publishable/anon** key — veilig client-side, RLS beschermt
de data. De `sbp_`-token (MCP) en de service-role key horen hier **niet**.

## Inbound: doorstuur-naar-uitnodiging

Elke ondernemer heeft een uniek inbox-adres `<invite_inbox>@invite.reviewupgrade.nl`
(kolom `customers.invite_inbox`). Stuurt hij een klant-mail door, dan vist de
webhook `POST /api/inbound-invite` het klant-adres eruit en stuurt die persoon een
review-uitnodiging (`invites.source='inbound'`). De afzender moet de eigen
`customers.email` van het bedrijf zijn (anti-misbruik).

Eenmalige setup in het **Resend-dashboard**:

1. **Receiving** aanzetten voor `invite.reviewupgrade.nl` en de opgegeven **MX-records**
   in Cloudflare DNS zetten (subdomein → root-MX blijft ongemoeid).
2. **Webhook** `email.received` → `https://reviewupgrade.nl/api/inbound-invite`.
   (Aangemaakt via de API: webhook-id `fee6f12d-7b07-477a-9f0c-11cd5cf84e56`.)

Secrets (naast `NUXT_SUPABASE_SERVICE_KEY`, zie cron hieronder — vereist, want de
webhook draait zonder user-sessie):

```bash
npx wrangler secret put NUXT_RESEND_WEBHOOK_SECRET   # whsec_... (Svix signing secret van de webhook)
# Optioneel als je een ander (sub)domein gebruikt dan de default invite.reviewupgrade.nl:
npx wrangler secret put NUXT_PUBLIC_INVITE_INBOX_DOMAIN
```

Lokaal (`.env`): `RESEND_WEBHOOK_SECRET` + `INVITE_INBOX_DOMAIN`. Volledig end-to-end
testen kan alleen op productie — Resend kan `localhost` niet bereiken.

## Google-score cron (dagelijkse snapshots)

Dagelijks (03:30 UTC) haalt de Worker voor elke klant met een `google_place_id`
én status `trial`/`active` de Google-score op en logt een snapshot
(`source='cron'`) — zonder dat er iemand op het dashboard hoeft te komen. De
planning staat in `wrangler.jsonc` (`"triggers": { "crons": ["30 3 * * *"] }`) en
vuurt de Nitro-hook `cloudflare:scheduled`
(`server/plugins/cloudflare-scheduled.ts`), die `logAllGoogleScores` draait.

De cron insert de snapshots **direct** via de service-role (geen user-sessie), dus
deze twee secrets zijn vereist:

```bash
npx wrangler secret put NUXT_SUPABASE_SERVICE_KEY   # service-role key (sb_secret_... of legacy service_role JWT)
npx wrangler secret put NUXT_CRON_SECRET            # willekeurige string; beschermt het handmatige/externe trigger-endpoint
```

`NUXT_CRON_SECRET` beschermt het HTTP-endpoint
`POST /api/cron/google-scores` (header `x-cron-secret`), waarmee je de run
handmatig of extern kunt aftrappen. Lokaal test je met `CRON_SECRET` uit `.env`:

```bash
curl -X POST http://localhost:2001/api/cron/google-scores -H "x-cron-secret: <CRON_SECRET>"
# -> {"checked":N,"logged":M}  (verkeerde/ontbrekende header -> 401)
```

**Fallback (als de CF Cron Trigger ooit niet beschikbaar is):** zet in Supabase
een `pg_cron`-job die met `pg_net` een POST doet naar
`https://reviewupgrade.nl/api/cron/google-scores` met de `x-cron-secret`-header.
Het HTTP-endpoint is de primaire, geteste route; de CF-trigger is enkel een
tweede aanroeper van dezelfde code.

## ⚠️ Belangrijk vóór productie

1. **Dev-login uitzetten.** `DEV_LOGIN_ENABLED` mag in een productie-build
   **niet** gezet zijn — de waarde wordt at build-time in de client gebakken
   (`runtimeConfig.public.devLogin`). Bouw productie dus met die env **leeg/uit**.
2. **Dev-users verwijderen.** De seed `supabase/seed-dev-users.sql` maakt
   `admin@reviewupgrade.test` en `klant@reviewupgrade.test` met wachtwoord
   `devpass1234`. Die zijn alleen voor lokaal testen. Verwijder ze (of rouleer)
   voordat dit project naar productie gaat:
   ```sql
   delete from auth.users where email like '%@reviewupgrade.test';
   ```
3. **Echte admin aanmaken.** Geef een echte gebruiker de admin-rol:
   ```sql
   update auth.users
     set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
     where email = 'jij@bedrijf.nl';
   ```
   De rol staat in `app_metadata` (server-side, niet user-editable) en wordt door
   de RLS-policies en de admin-middleware gelezen.
4. **OTP-mailtemplate.** De signup/login gebruikt 6-cijferige e-mail-OTP
   (`verifyOtp`). Zorg dat de Supabase Auth-mailtemplate de **`{{ .Token }}`**
   bevat (Dashboard → Authentication → Email Templates), anders krijgt de
   gebruiker alleen een magic-link i.p.v. een code. Voor betrouwbaarheid later
   eigen SMTP/domein instellen.

## Architectuurnoot — geen service-role nodig

Admin-dashboard en alle data-acties draaien **client-side** via de ingelogde
sessie; de Supabase **RLS-policies** dwingen toegang af (`is_admin()` leest
`app_metadata.role` uit de JWT). Dat is veilig en vereist géén service-role key
in de Worker. De `SUPABASE_SERVICE_KEY` is alleen nodig als je later expliciet
server-side admin-mutaties wilt toevoegen.
