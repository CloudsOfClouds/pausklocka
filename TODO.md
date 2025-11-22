# TODO – Planerade förbättringar för Pausklocka
Detta dokument samlar idéer, prioriteringar och kommande funktioner inför framtida versioner.

## 1. Prioriterade förbättringar
Dessa delar ger störst värde i arbetet under direktsända matcher.

### Wake Lock (hindra mobilen från att slockna)
- Förhindrar att skärmen släcks under pauser.
- Särskilt viktigt i arenamiljö.

### Fullskärmsläge
- Döljer alla input-fält.
- Visar endast timers, tightness och klocka.
- Bättre översikt vid stressade moment.

### Realtidsuppdatering av tightness
- Tightness uppdateras direkt vid ändring av fält.
- Ingen “Räkna”-knapp behövs.

### “Nästa period”-knapp
- Nollställer rätt fält automatiskt.
- Sätter “Period slutade” till aktuell tid.
- Snabbare arbetsflöde mellan perioder.

## 2. Funktioner för bättre arbetsflöde

### Copy-knapp
- Kopierar tider (on-air, periodstart) till urklipp.
- Smidigt för körschema och kommunikation.

### Egna presets
- Möjlighet att spara egna ligor/sporter.
- Exempel: SHL, HockeyAllsvenskan, SSL, cuper.

### Ljud- eller blinkvarning
- Vid 30 sek kvar till on-air.
- Valbart läge.

### Auto-stor text
- Större text vid kritiska marginaler (orange/röd tightness).

## 3. PWA-stöd (installationsbar app)
- Installera på iOS/Android.
- Offline-läge för arenor med dålig uppkoppling.
- Egen ikon och app-upplevelse.

## 4. UI / UX förbättringar

### Större timers
- Bättre läsbarhet i mobil.
- Anpassas efter skärmstorlek automatiskt.

### Fler färgteman
- Ljust och mörkt läge.
- Automatisk växling vid behov.

### Animerade färgskiften
- Mjukare övergångar i tightness-indikatorn.

## 5. Kodrelaterade förbättringar

### Refactor av app.js
- Tydligare strukturering av logik.
- Möjlighet att dela upp i moduler senare.

### Testdata-läge
- Generera fejkade tider för snabb UI-testning.

### Förbättrad felhantering
- Tydligare felmeddelanden vid fel format.
- Markering av fält som behöver korrigeras.

## 6. Långsiktiga idéer / Önskelista
- Stöd för fler sporter (basket, handboll, hockey med powerbreak).
- Exportera tider som PDF eller bild.
- Vibrationsvarning vid kritiska marginaler.
- Synk mellan flera enheter (kommentator + producent).
- Loggning av tidigare pauser för statistik.



