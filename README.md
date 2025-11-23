# Pausklocka (TV-produktion)

Ett webbaserat verktyg för att snabbt och exakt planera pauser vid direktsända sportevenemang.  
Används av grafikoperatörer, producenter och kommentatorer som behöver tydliga tider under intensiva sändningar.

Appen är statisk (HTML/CSS/JS), mobiloptimerad och deployas automatiskt via **Vercel** från GitHub.

---

## 🔗 Live Demo

👉 **https://pausklocka.vercel.app**

Sidan uppdateras automatiskt varje gång en commit görs till huvudgrenen (`main`).

---

## Funktioner

- Live-klocka i realtid (HH:MM:SS) med korrekt sekundsynk.
- Presets för bandy, innebandy och fotboll.
- Automatiska tider för:
  - Pauslängd
  - Billboard + vinjett
  - Höjdpunkter
  - Extra prat
- Intervju-modul med autosummering (hemmalag + bortalag).
- Tightness-indikator med färgkodning (grön, gul, orange, röd).
- Autosave av alla fält via localStorage.
- Mobiloptimerad layout och arenavänligt mörkt tema.

---

## Installation & utveckling

### 1. Klona projektet
```bash
git clone https://github.com/CloudsOfClouds/pausklocka
cd pausklocka
