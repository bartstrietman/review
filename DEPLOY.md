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
