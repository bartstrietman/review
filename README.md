# ReviewUpgrade — Prototype site

Landingspagina + aanmeldflow voor ReviewUpgrade: een SaaS-widget waarmee lokale ondernemers tevreden klanten doorsturen naar Google en ontevreden klanten privé opvangen.

## Structuur

Alles zit in één zelfstandig bestand:

```
index.html     ← de volledige site (HTML + CSS + JS in één bestand)
README.md      ← dit bestand
```

## Wat er in zit

- **Homepage** — hero, hoe het werkt, branche-tabs (5 categorieën, 50+ sectoren), widget-previews, live demo, ROI-calculator, reviews, privacy-blok, vergelijkingstabel, pakketten (€19,99 / €34,49), urgentie-blok, exit-intent banner, aanmeldflow
- **Aanmeldflow** — 5 stappen: pakket → bedrijfsgegevens (NAW + telefoon) → huisstijl (kleurenpalet + hex-invoer) → betaling → bevestigingspagina met popup- én embed-code
- **Subpagina's** — Hoe werkt het, FAQ (10 vragen incl. incasso/opzeggen), Contact
- **NL / EN taalwisselaar** — alle tekst volledig vertaald, inclusief branches, FAQ en flow

## Technische details

- Vanilla HTML/CSS/JS — geen frameworks, geen dependencies
- Geen externe bestanden nodig (alle iconen zijn inline SVG)
- Google Fonts worden geladen via CDN (Space Grotesk + Inter)
- Stripe-koppeling en n8n-automatisering: **nog niet gebouwd** — dit is een front-end prototype

## Volgende stappen (te bouwen in Cowork)

1. `core.js` widget-logica losmaken als apart bestand (voor klanten om te embedden)
2. Per-klant config-bestanden automatisch genereren via n8n
3. Stripe Checkout koppelen aan de aanmeldflow
4. Hetzner VPS opzetten voor hosting van widget-bestanden
5. n8n-workflow: Stripe webhook → config genereren → mail met code → notificatie

## GitHub Pages instellen

1. Ga naar de repo → Settings → Pages
2. Kies bij "Source": `Deploy from a branch` → `main` → `/ (root)`
3. Sla op — na ~1 minuut is de site live op `gebruikersnaam.github.io/reviewupgrade`

## Domein koppelen (later)

Zodra je een domeinnaam hebt (bijv. reviewupgrade.nl of een alternatief):
1. Voeg een `CNAME` bestand toe aan de repo met daarin de domeinnaam
2. Stel bij je domeingregistrar een A-record in naar GitHub Pages IP-adressen
3. Zet "Enforce HTTPS" aan in GitHub Pages settings
