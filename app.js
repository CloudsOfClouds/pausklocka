let onAirTimer = null;
let periodTimer = null;
let manualPhase = "before"; // "before", "billboard", "done"
let manualBillboardEndSeconds = null;


const STORAGE_KEY = "pausePlannerStateV1";

/* ---------- HJÄLPFUNKTIONER ---------- */

function parseHHMMToSeconds(str) {
  if (!str) return null;
  const parts = str.split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 3600 + parts[1] * 60;
}

function parseDurationToSeconds(str) {
  if (!str) return 0;

  // Gör det lättare att skriva på mobilen:
  // 1,15 eller 1.15 tolkas som 1:15
  str = str.trim().replace(",", ":").replace(".", ":");

  const parts = str.split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return 0;

  if (parts.length === 1) {
    // "5" -> 5 minuter
    return parts[0] * 60;
  }

  if (parts.length === 2) {
    // "MM:SS" (t.ex. 1:20 eller 1,20)
    const [m, s] = parts;
    return m * 60 + s;
  }

  if (parts.length === 3) {
    // "HH:MM:SS" (t.ex. 00:18:00 från preset)
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  return 0;
}

function startLiveClock() {
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("liveClock").textContent = `${h}:${m}:${s}`;

    // Uppdatera manuell nedräkning + billboard-kedja
    updateManualOnAirCountdown();

    // Räkna ut exakt när nästa sekund börjar
    const msToNextSecond = 1000 - now.getMilliseconds();
    setTimeout(updateClock, msToNextSecond);
  }

  updateClock();
}

startLiveClock();






function secondsToHHMMSS(totalSeconds) {
  totalSeconds = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0")
  );
}

function secondsToMMSS(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function diffToCountdownString(diffSeconds) {
  if (diffSeconds <= 0) return "Nu";
  const m = Math.floor(diffSeconds / 60);
  const s = diffSeconds % 60;
  return m + " min " + String(s).padStart(2, "0") + " s kvar";
}

function formatMargin(seconds) {
  const sign = seconds < 0 ? "-" : "+";
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return sign + m + " min " + String(s).padStart(2, "0") + " s";
}

function updateManualOnAirCountdown() {
  const input = document.getElementById("manualOnAir");
  const box = document.getElementById("manualOnAirBox");
  const labelOnAir = document.getElementById("manualOnAirCountdown");
  const labelBillboard = document.getElementById("manualBillboardCountdown");

  if (!input || !box || !labelOnAir || !labelBillboard) return;

  const manualValue = input.value;
  const billboardStr = document.getElementById("billboard").value;

  // Om ingen sändningstid är angiven döljer vi allt
  if (!manualValue) {
    box.style.display = "none";
    labelOnAir.textContent = "";
    labelBillboard.textContent = "";
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    return;
  }

  const targetSeconds = parseHHMMToSeconds(manualValue);
  if (targetSeconds === null) {
    box.style.display = "none";
    labelOnAir.textContent = "";
    labelBillboard.textContent = "";
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    return;
  }

  const now = new Date();
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diff = targetSeconds - nowSeconds;

  box.style.display = "block";

  // Om vi fortfarande är före sändningsstart: räkna ner till sändningsstart
  if (diff > 0) {
    manualPhase = "before";
    manualBillboardEndSeconds = null;

    labelOnAir.textContent =
      "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
    labelBillboard.textContent = "";
    return;
  }

  // Här är vi vid eller efter sändningsstart
  if (manualPhase === "before") {
    // Starta billboard-nedräkning första gången vi passerar sändningsstart
    const billboardSeconds = parseDurationToSeconds(billboardStr);
    if (billboardSeconds > 0) {
      manualBillboardEndSeconds = nowSeconds + billboardSeconds;
      manualPhase = "billboard";
    } else {
      manualPhase = "done";
    }
  }

  // Visa att sändningsstart är nu
  labelOnAir.textContent = "Nedräkning till sändningsstart: Nu";

  if (manualPhase === "billboard" && manualBillboardEndSeconds !== null) {
    const remaining = manualBillboardEndSeconds - nowSeconds;

    if (remaining <= 0) {
      manualPhase = "done";
      labelBillboard.textContent = "Billboard + vinjett: Klar";
    } else {
      labelBillboard.textContent =
        "Nedräkning billboard + vinjett: " + diffToCountdownString(remaining);
    }
  } else if (manualPhase === "done") {
    if (billboardStr && parseDurationToSeconds(billboardStr) > 0) {
      labelBillboard.textContent = "Billboard + vinjett: Klar";
    } else {
      labelBillboard.textContent = "";
    }
  }
}

function updateManualOnAirCountdown() {
  const input = document.getElementById("manualOnAir");
  const box = document.getElementById("manualOnAirBox");
  const label = document.getElementById("manualOnAirCountdown");

  if (!input || !box || !label) return;

  // Om ingen tid är angiven: dölj boxen
  if (!input.value) {
    box.style.display = "none";
    label.textContent = "";
    return;
  }

  const targetSeconds = parseHHMMToSeconds(input.value);
  if (targetSeconds === null) {
    box.style.display = "none";
    label.textContent = "";
    return;
  }

  const now = new Date();
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diff = targetSeconds - nowSeconds;

  box.style.display = "block";

  if (diff <= 0) {
    label.textContent = "Nedräkning till sändningsstart: Nu";
  } else {
    label.textContent =
      "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
  }
}


/* ---------- PRESETS ---------- */

function applyPreset(value) {
  const pauseInput = document.getElementById("pauseMinutes");
  const info = document.getElementById("presetInfo");
  const billboardInput = document.getElementById("billboard");

  if (value === "bandy") {
    pauseInput.value = "00:18:00";   // 18 min paus
    billboardInput.value = "00:01:20"; // 1:20 billboard
    info.textContent = "Bandy: ca 18 min paus och 1:20 standard vinjett.";
  } else if (value === "innebandy") {
    pauseInput.value = "00:15:00";   // 15 min paus
    billboardInput.value = "00:00:50"; // 0:50 billboard
    info.textContent = "Innebandy: ca 10–15 min paus och 0:50 standard vinjett.";
  } else if (value === "fotboll") {
    pauseInput.value = "00:15:00";   // 15 min paus
    billboardInput.value = "00:02:04"; // 2:04 billboard
    info.textContent = "Fotboll: ca 15 min paus och 2:04 standard vinjett.";
  } else {
    info.textContent = "";
  }
}


/* ---------- PERIODSLUT = NU ---------- */

function setPeriodEndToNow() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("periodEnd").value = `${h}:${m}`;
  saveState();
}

/* ---------- INTERVJU-TOTAL ---------- */

function updateInterviewTotal() {
  const homeStr = document.getElementById("interviewHome").value;
  const awayStr = document.getElementById("interviewAway").value;

  const homeSec = parseDurationToSeconds(homeStr);
  const awaySec = parseDurationToSeconds(awayStr);

  const totalSec = homeSec + awaySec;

  document.getElementById("interviewTotalText").textContent =
  totalSec > 0 ? secondsToMMSS(totalSec) : "0:00";
}

/* ---------- AUTOSAVE ---------- */

function saveState() {
  try {
    const state = {
      preset: document.getElementById("preset").value,
      periodEnd: document.getElementById("periodEnd").value,
      pauseMinutes: document.getElementById("pauseMinutes").value,
      billboard: document.getElementById("billboard").value,
      highlights: document.getElementById("highlights").value,
      talk: document.getElementById("talk").value,
      interviewHome: document.getElementById("interviewHome").value,
      interviewAway: document.getElementById("interviewAway").value,
      manualOnAir: document.getElementById("manualOnAir").value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Kunde inte spara state", e);
  }
}



function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);

    if (state.preset) {
      const presetSelect = document.getElementById("preset");
      presetSelect.value = state.preset;
      applyPreset(state.preset);
    }

    if (state.periodEnd !== undefined) {
      document.getElementById("periodEnd").value = state.periodEnd;
    }
    if (state.pauseMinutes !== undefined) {
      document.getElementById("pauseMinutes").value = state.pauseMinutes;
    }
    if (state.billboard !== undefined) {
      document.getElementById("billboard").value = state.billboard;
    }
    if (state.highlights !== undefined) {
      document.getElementById("highlights").value = state.highlights;
    }
    if (state.talk !== undefined) {
      document.getElementById("talk").value = state.talk;
    }
    if (state.interviewHome !== undefined) {
      document.getElementById("interviewHome").value = state.interviewHome;
    }
    if (state.interviewAway !== undefined) {
      document.getElementById("interviewAway").value = state.interviewAway;
    }
    if (state.manualOnAir !== undefined) {
      document.getElementById("manualOnAir").value = state.manualOnAir;
    }
    if (state.manualOnAir !== undefined) {
      document.getElementById("manualOnAir").value = state.manualOnAir;
    }

    updateInterviewTotal();
  } catch (e) {
    console.warn("Kunde inte läsa state", e);
  }
}


/* ---------- HUVUDKALKYL ---------- */

function calculate() {
  const periodEndStr = document.getElementById("periodEnd").value;
  const pauseStr = document.getElementById("pauseMinutes").value || "";

  const billboardStr = document.getElementById("billboard").value;
  const highlightsStr = document.getElementById("highlights").value;
  const talkStr = document.getElementById("talk").value;

  const periodEndSeconds = parseHHMMToSeconds(periodEndStr);
  if (periodEndSeconds === null) {
    alert("Ange tid när perioden slutade (HH:MM).");
    return;
  }

  // Paus som HH:MM:SS
  const pauseSeconds = parseDurationToSeconds(pauseStr);

  const totalContentSeconds =
    parseDurationToSeconds(billboardStr) +
    parseDurationToSeconds(highlightsStr) +
    parseDurationToSeconds(talkStr);

  const periodStartSeconds = periodEndSeconds + pauseSeconds;
  const onAirSeconds = periodStartSeconds - totalContentSeconds;

  const resultLines = document.getElementById("resultLines");
  resultLines.innerHTML = `
    <p>Beräknad periodstart: <strong>${secondsToHHMMSS(periodStartSeconds)}</strong></p>
    <p>Rekommenderad sändningsstart: <strong>${secondsToHHMMSS(onAirSeconds)}</strong></p>
    <p>Totalt innehåll (billboard + highlights + prat): 
      <strong>${Math.floor(totalContentSeconds / 60)} min ${totalContentSeconds % 60} s</strong>
    </p>
  `;

// Tightness-indikator

  const tightnessDiv = document.getElementById("tightness");
  const marginSeconds = pauseSeconds - totalContentSeconds;

  let tightText = "";
  let tightClass = "tightness";

  if (marginSeconds >= 180) {
    tightText = "Grön: Du har gott om marginal, " + formatMargin(marginSeconds) + " utöver paketet.";
    tightClass += " tightness-good";
  } else if (marginSeconds >= 60) {
    tightText = "Gul: Rimlig marginal, " + formatMargin(marginSeconds) + " utöver paketet.";
    tightClass += " tightness-medium";
  } else if (marginSeconds >= 0) {
    tightText = "Orange: Väldigt tight, bara " + formatMargin(marginSeconds) + " kvar utöver paketet.";
    tightClass += " tightness-low";
  } else {
    tightText = "Röd: Paketet är längre än pausen, " + formatMargin(marginSeconds) + ". Du kommer bli sen om du kör allt.";
    tightClass += " tightness-bad";
  }

  tightnessDiv.textContent = tightText;
  tightnessDiv.className = tightClass;

  document.getElementById("output").style.display = "block";

  if (onAirTimer) clearInterval(onAirTimer);
  if (periodTimer) clearInterval(periodTimer);

  function updateCountdowns() {
    const now = new Date();
    const nowSeconds =
      now.getHours() * 3600 +
      now.getMinutes() * 60 +
      now.getSeconds();

    document.getElementById("countdownOnAir").textContent =
      "Till sändningsstart: " + diffToCountdownString(onAirSeconds - nowSeconds);

    document.getElementById("countdownPeriod").textContent =
      "Till periodstart: " + diffToCountdownString(periodStartSeconds - nowSeconds);
  }

  updateCountdowns();
  onAirTimer = setInterval(updateCountdowns, 1000);
  periodTimer = onAirTimer; // vi återanvänder samma timer
  saveState();
}


/* ---------- INIT OCH EVENTLYSSNARE ---------- */

loadState();

[
  "preset",
  "periodEnd",
  "pauseMinutes",
  "billboard",
  "highlights",
  "talk",
  "interviewHome",
  "interviewAway",
  "manualOnAir"
].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const evt = el.tagName === "SELECT" || el.type === "number" ? "change" : "input";
    el.addEventListener(evt, () => {
    if (id === "interviewHome" || id === "interviewAway") {
      updateInterviewTotal();
    }
    if (id === "manualOnAir" || id === "billboard") {
      manualPhase = "before";
      manualBillboardEndSeconds = null;
      updateManualOnAirCountdown();
    }
    saveState();
  });



document.getElementById("setNowBtn").addEventListener("click", (e) => {
  e.preventDefault();
  setPeriodEndToNow();
});

document.getElementById("calcBtn").addEventListener("click", (e) => {
  e.preventDefault();
  calculate();
});



