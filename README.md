# Pausklocka (TV-produktion)

Ett webbaserat verktyg för att snabbt och exakt planera pauser vid direktsända sportevenemang.
Byggt för grafikoperatörer, producenter och kommentatorer som behöver exakta tider under intensiva sändningar.

Appen är helt statisk (HTML/CSS/JS), optimerad för mobil och deployas automatiskt via GitHub → Netlify.

Funktioner
- Live-klocka i realtid (HH:MM:SS) med exakt sekundsynk.
- Presets för bandy, innebandy och fotboll.
- Automatiska fält för billboard, highlights och extrapratt.
- Intervju-modul (hemmalag/bortalag) med autosummering.
- Beräknad periodstart och rekommenderad sändningsstart.
- Tightness-indikator med färgkodning:
 - Grön: gott om marginal
 - Gul: rimlig marginal
 - Orange: mycket tight
 - Röd: paketet är för långt
- Autosave: alla fält sparas i webbläsarens localStorage.
- Mobiloptimerad layout med mörkt tema, utvecklat för arenamiljö.

Version
Projektet använder semantisk versionering.
Aktuell version: v6.0 – GitHub & Netlify Edition

Läs hela CHANGELOG i CHANGELOG.md.

Installation och utveckling
1. Klona projektet
git clone https://github.com/CloudsOfClouds/pausklocka
cd pausklocka

2. Öppna lokalt
Det finns ingen build-process, så öppna bara:

index.html
i valfri webbläsare.

3. Struktur
pausklocka/
├── index.html       # huvud-UI
├── style.css        # layout & styling
├── app.js           # logik, kalkyler, timer, autosave
├── README.md        # den här filen
├── CHANGELOG.md     # versionshistorik
└── TODO.md          # framtida funktioner

Deployment (automatisk)
Sidan deployas automatiskt via Netlify varje gång en commit görs till main.

- Netlify-inställningar
- Build command: (tomt)
- Publish directory: /
- Functions: används inte

Live-sidan
https://pausklocka.netlify.app
(Uppdateras ca 5–10 sek efter varje commit.)

Hur man uppdaterar appen
1. Öppna valfri fil på GitHub (t.ex. index.html).
2. Klicka på pennan (edit).
3. Gör ändringar.
4. Commit.
5. Netlify deployar automatiskt.

Kommande funktioner
- (Se TODO.md för detaljer)
- Wake Lock (förhindrar att mobilen släcker skärmen).
- Fullskärmsläge utan input-fält.
- Realtidsuppdatering av tightness utan att man trycker "Räkna".
- Ljud- eller blinkvarning vid 30 sek till on-air.
- Copy-knapp för tider.
- PWA-stöd så appen kan installeras som riktig mobilapp.

Licens
Detta projekt är för personligt bruk, intern produktion och utvecklingsarbete.
Ingen extern licens krävs.

Kontakt
Utvecklad av CloudsOfClouds.
För frågor, idéer eller förbättringar – öppna gärna en issue i GitHub-repot.


