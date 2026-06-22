# Project: review

## Solo MCP — dev server beheren

De dev server draait onder **Solo** (zie `solo.yml`, proces **"Dev server"**, poort **2001**).
Gebruik de **Solo MCP** om 'm te beheren in plaats van zelf `pnpm dev` in een shell te starten:

- **Herstarten:** `restart_process` met `name: "Dev server"` (of `restart_all_commands`).
- **Starten / stoppen:** `start_process` / `stop_process`.
- **Status & logs:** `get_process_status`, `get_process_output`, `search_output`.
- **Poort checken:** `get_process_ports` of `wait_for_bound_port` (verwacht **2001**).

Na een config-wijziging (bv. poort in `package.json` of `solo.yml`) herstart je het
"Dev server"-proces via `restart_process` zodat de nieuwe config actief wordt.

## Supabase MCP

Dit project gebruikt een **project-scoped Supabase MCP-server**, geconfigureerd in `.mcp.json`.

- **Project-ref:** `outddpbiubsqnqxzufcm` (URL: https://outddpbiubsqnqxzufcm.supabase.co)
- **Toegang:** volledig (lees + schrijf) — géén `--read-only`.
- **Server-naam in Claude Code:** `supabase`

### Hoe de authenticatie werkt

`.mcp.json` verwijst naar de env-variabele `${SUPABASE_ACCESS_TOKEN}`. Claude Code
vult die in vanuit de shell waarin het start. De token (een Supabase **Personal
Access Token**, begint met `sbp_`) staat permanent geëxporteerd in `~/.zshrc`, dus
elke nieuwe shell heeft 'm automatisch — geen handmatige `export` per sessie nodig.

De token staat **niet** in git: `.env` (lokale kopie) en `.env.local` staan in
`.gitignore`. Alleen `.env.example` (sjabloon zonder secret) wordt gecommit.

### Als de Supabase MCP niet laadt

1. Check dat de token in de shell zit: `echo $SUPABASE_ACCESS_TOKEN` (moet met `sbp_` beginnen).
2. Zo niet: nieuwe terminal openen (`~/.zshrc` wordt dan opnieuw geladen) en Claude Code herstarten.
3. Bij eerste keer vraagt Claude Code of je de project-MCP-server vertrouwt → bevestigen.

### Een ander Supabase-project gebruiken

- Pas `--project-ref=...` in `.mcp.json` aan.
- Genereer een nieuwe token op https://supabase.com/dashboard/account/tokens en
  vervang de regel in `~/.zshrc` (en eventueel `.env`).

> Let op: de `sb_publishable_...` sleutel is de client-side/anon-key voor de
> frontend en hoort **niet** in de MCP-config. De MCP heeft de `sbp_`-token nodig.
