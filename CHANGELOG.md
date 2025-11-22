# CHANGELOG

v6.0 – GitHub & Netlify Edition (2025-11-23)

En större version med både nya funktioner, förbättringar och en helt ny deploy-modell.
Nytt

- Migrering från Netlify Drop till GitHub-baserad deploy pipeline.
- Automatisk deployment via Netlify vid varje commit.
- Live-klocka med exakt sekundsynk (HH:MM:SS).
- Förbättrade presets med tydligare defaultvärden.
- Ny struktur för projektfiler (index.html, style.css, app.js, README, TODO).
- Tydligare sektioner, förbättrade rubriker och mer konsekvent layout i HTML.

Förbättringar
- Omdesignad intervju-modul, placerad direkt under presets.
- Total intervjutid beräknas live (mm:ss).
- Förtydligad text att intervjuer inte påverkar pauskalkylen.
- Förbättrad tightness-indikator med mjukare färgskiften.
- Optimerad kod för mobilvy och läsbarhet.
- Förbättrad tidstolkning (stöd för MM:SS, HH:MM:SS, decimal, komma, punkt).

Fixar
- Justerad beräkning av periodstart/on-air vid sekunder.
- Fix för autosave av alla fält.
- Stabilare countdown (uppdateras per sekund utan drift).
- Felvisningar med tomma eller felaktiga fält minimerade.

v5.0 – Tightness-indikator
- Färgkodad tightness (grön, gul, orange, röd).
- Visar exakt marginal (+/- minuter och sekunder).
- Förklarande texter per färgnivå.

v4.0 – Intervju-modul
- Fält för hemma- och bortalagsintervjuer.
- Autosummering av intervjutider.
- Informationstext om att intervjuer inte påverkar pausen.

v3.0 – Presets + autosave
- Presets för bandy, innebandy och fotboll.
- Standard-billboard enligt sport.
- Autosave via localStorage på alla fält.

v2.0 – Separata filer + mörkt tema
- Uppdelning i index.html, style.css och app.js.
- Mobilvänlig layout.
- Infört mörkt tema optimerat för arenamiljö.

v1.0 – Grundversion
- Enkelt formulär för periodstart och on-air.
- Grundläggande kalkyl för paustid.


