let onAirTimer = null;
let periodTimer = null;
let manualPhase = "before"; // "before", "billboard", "done"
let manualBillboardEndSeconds = null;

const STORAGE_KEY = "pausePlannerStateV1";

/* ---------- HJÄLPFUNKTIONER ---------- */

function parseHHMMToSeconds(str) {
  if (!str) return null;
  const parts = str.split(":").map(Number);
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 3600 + parts[1] * 60;
}

// mm:ss eller HH:MM:SS
function parseDurationToSeconds(str) {
  if (!str) return 0;
  const parts = str.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

function formatTime(date) {
  if (!(date instanceof Date)) return "";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function secondsToCountdownString(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return "";
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h} h ${m} min ${s} s`;
  }
  if (m > 0) {
    return `${m} min ${s} s`;
  }
  return `${s} s`;
}

function diffToCountdownString(diffSeconds) {
  if (diffSeconds <= 0) return "Nu";
  return secondsToCountdownString(diffSeconds);
}

function addSeconds(baseDate, seconds) {
  const d = new Date(baseDate.getTime());
  d.setSeconds(d.getSeconds() + seconds);
  return d;
}

/* ---------- LIVEKLOCKA + MANUELL NEDRÄKNING ---------- */

function startLiveClock() {
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    const liveEl = document.getElementById("liveClock");
    if (liveEl) {
      liveEl.textContent = `${h}:${m}:${s}`;
    }

    // Uppdatera kedjan: sändningsstart -> billboard + vinjett
    updateManualOnAirCountdown();

    const msToNextSecond = 1000 - now.getMilliseconds();
    setTimeout(updateClock, msToNextSecond);
  }

  updateClock();
}

/**
 * Kedja:
 * 1) Nedräkning till sändningsstart (manualOnAir)
 * 2) När den träffar 0 startar nedräkning på billboard + vinjett
 */
function updateManualOnAirCountdown() {
  const input = document.getElementById("manualOnAir");
  const box = document.getElementById("manualOnAirBox");
  const labelOnAir = document.getElementById("manualOnAirCountdown");
  const labelBillboard = document.getElementById("manualBillboardCountdown");

  if (!input || !box || !labelOnAir || !labelBillboard) return;

  const manualValue = input.value;
  const billboardStr = document.getElementById("billboard").value;

  // Ingen sändningstid angiven
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

  // Fortfarande före sändningsstart
  if (diff > 0) {
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    labelOnAir.textContent = "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
    labelBillboard.textContent = "";
    return;
  }

  // Vi är vid eller efter sändningsstart
  if (manualPhase === "before") {
    const billboardSeconds = parseDurationToSeconds(billboardStr);
    if (billboardSeconds > 0) {
      manualBillboardEndSeconds = nowSeconds + billboardSeconds;
      manualPhase = "billboard";
    } else {
      manualPhase = "done";
    }
  }

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

/* ---------- PRESETS ---------- */

function applyPreset(preset) {
  const pauseInput = document.getElementById("pauseMinutes");
  const billboardInput = document.getElementById("billboard");
  const highlightsInput = document.getElementById("highlights");
  const talkInput = document.getElementById("talk");

  if (!pauseInput || !billboardInput || !highlightsInput || !talkInput) return;

  if (!preset) {
    pauseInput.value = "";
    billboardInput.value = "";
    highlightsInput.value = "";
    talkInput.value = "";
    return;
  }

  if (preset === "hockey_18") {
    pauseInput.value = "18:00";
    billboardInput.value = "0:30";
    highlightsInput.value = "4:00";
    talkInput.value = "3:30";
  } else if (preset === "hockey_20") {
    pauseInput.value = "18:00";
    billboardInput.value = "0:30";
    highlightsInput.value = "5:00";
    talkInput.value = "4:30";
  } else if (preset === "football_45") {
    pauseInput.value = "15:00";
    billboardInput.value = "0:30";
    highlightsInput.value = "5:00";
    talkInput.value = "3:00";
  }
}

/* ---------- INTERVJUPAKET ---------- */

function parseMMSS(str) {
  if (!str) return 0;
  const parts = str.split(":").map((p) => Number(p.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return 0;
  const [m, s] = parts;
  return m * 60 + s;
}

function formatMMSS(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateInterviewTotal() {
  const home = parseMMSS(document.getElementById("interviewHome").value);
  const away = parseMMSS(document.getElementById("interviewAway").value);
  const total = home + away;
  const el = document.getElementById("interviewTotal");
  if (el) el.textContent = formatMMSS(total);
}

/* ---------- TIGHTNESS-INDIKATOR ---------- */

function setTightnessMessage(diffSeconds) {
  const tightnessEl = document.getElementById("tightness");
  if (!tightnessEl) return;

  tightnessEl.className = "tightness";

  if (diffSeconds < -60) {
    tightnessEl.textContent = "Du ligger mycket efter, kapa innehåll eller ta bort inslag.";
    tightnessEl.classList.add("tightness-bad");
  } else if (diffSeconds < 0) {
    tightnessEl.textContent = "Du ligger lite efter, överväg att korta någon del.";
    tightnessEl.classList.add("tightness-warn");
  } else if (diffSeconds <= 60) {
    tightnessEl.textContent = "Tajming nästan perfekt, bara några sekunder marginal.";
    tightnessEl.classList.add("tightness-good");
  } else if (diffSeconds <= 180) {
    tightnessEl.textContent = "Du har lite luft, fyll på med extra prat eller grafik.";
    tightnessEl.classList.add("tightness-ok");
  } else {
    tightnessEl.textContent = "Stor marginal, fundera på om ni vill lägga till mer innehåll.";
    tightnessEl.classList.add("tightness-loose");
  }
}

/* ---------- HUVUDBERÄKNING ---------- */

function calculate() {
  const resultLinesEl = document.getElementById("resultLines");
  if (!resultLinesEl) return;

  // VISA resultatboxen när vi räknar
  const outputBox = document.getElementById("output");
  if (outputBox) {
    outputBox.style.display = "block";
  }

  resultLinesEl.innerHTML = "";
  const countdownOnAirEl = document.getElementById("countdownOnAir");
  const countdownPeriodEl = document.getElementById("countdownPeriod");


  if (onAirTimer) {
    clearInterval(onAirTimer);
    onAirTimer = null;
  }
  if (periodTimer) {
    clearInterval(periodTimer);
    periodTimer = null;
  }

  const periodEndStr = document.getElementById("periodEnd").value.trim();
  const pauseStr = document.getElementById("pauseMinutes").value.trim();
  const billboardStr = document.getElementById("billboard").value.trim();
  const highlightsStr = document.getElementById("highlights").value.trim();
  const talkStr = document.getElementById("talk").value.trim();
  const interviewHomeStr = document.getElementById("interviewHome").value.trim();
  const interviewAwayStr = document.getElementById("interviewAway").value.trim();

  if (!periodEndStr || !periodEndStr.includes(":")) {
    resultLinesEl.innerHTML = "<p>Ange en giltig tid för när perioden slutade.</p>";
    return;
  }

  const now = new Date();
  const [h, m, s] = periodEndStr.split(":").map((p) => Number(p.trim()));
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) {
    resultLinesEl.innerHTML = "<p>Ange en giltig tid för när perioden slutade.</p>";
    return;
  }

  const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);

  const pauseSeconds = parseDurationToSeconds(pauseStr);
  const billboardSeconds = parseDurationToSeconds(billboardStr);
  const highlightsSeconds = parseDurationToSeconds(highlightsStr);
  const talkSeconds = parseDurationToSeconds(talkStr);
  const interviewHomeSeconds = parseMMSS(interviewHomeStr);
  const interviewAwaySeconds = parseMMSS(interviewAwayStr);
  const interviewTotalSeconds = interviewHomeSeconds + interviewAwaySeconds;

  const onAirTime = addSeconds(periodEnd, pauseSeconds);
  const billboardStart = addSeconds(onAirTime, -billboardSeconds);
  const highlightsStart = addSeconds(billboardStart, billboardSeconds);
  const talkStart = addSeconds(highlightsStart, highlightsSeconds);
  const interviewsStart = addSeconds(talkStart, talkSeconds);

  const payloadSeconds =
    billboardSeconds + highlightsSeconds + talkSeconds + interviewTotalSeconds;
  const diffSeconds = pauseSeconds - payloadSeconds;

  const lines = [];

  lines.push(
    `<p><strong>Sändningsstart:</strong> ${formatTime(onAirTime)}</p>`
  );
  lines.push(
    `<p><strong>Billboard + vinjett start:</strong> ${formatTime(
      billboardStart
    )} (${secondsToCountdownString(billboardSeconds)} totalt)</p>`
  );
  lines.push(
    `<p><strong>Höjdpunkter start:</strong> ${formatTime(
      highlightsStart
    )} (${secondsToCountdownString(highlightsSeconds)} totalt)</p>`
  );
  lines.push(
    `<p><strong>Extra prat start:</strong> ${formatTime(
      talkStart
    )} (${secondsToCountdownString(talkSeconds)} totalt)</p>`
  );
  lines.push(
    `<p><strong>Intervjupaket start:</strong> ${formatTime(
      interviewsStart
    )} (${secondsToCountdownString(interviewTotalSeconds)} totalt)</p>`
  );

  lines.push(
    `<p><strong>Payload:</strong> ${secondsToCountdownString(
      payloadSeconds
    )}</p>`
  );
  lines.push(
    `<p><strong>Skillnad mot pauslängd:</strong> ${diffSeconds} s</p>`
  );

  resultLinesEl.innerHTML = lines.join("\n");

  setTightnessMessage(diffSeconds);

  if (countdownOnAirEl) {
    onAirTimer = setInterval(() => {
      const nowInner = new Date();
      const diff = Math.floor((onAirTime.getTime() - nowInner.getTime()) / 1000);
      if (diff <= 0) {
        countdownOnAirEl.textContent = "Nedräkning till sändningsstart: Nu";
        clearInterval(onAirTimer);
        onAirTimer = null;
      } else {
        countdownOnAirEl.textContent =
          "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
      }
    }, 500);
  }

  if (countdownPeriodEl) {
    periodTimer = setInterval(() => {
      const nowInner = new Date();
      const diff = Math.floor((nowInner.getTime() - periodEnd.getTime()) / 1000);
      const absDiff = Math.abs(diff);
      countdownPeriodEl.textContent =
        "Tid sedan perioden slutade: " + secondsToCountdownString(absDiff);
    }, 1000);
  }
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

    updateInterviewTotal();
  } catch (e) {
    console.warn("Kunde inte läsa state", e);
  }
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  startLiveClock();

  const presetSelect = document.getElementById("preset");
  if (presetSelect) {
    presetSelect.addEventListener("change", () => {
      applyPreset(presetSelect.value);
      saveState();
    });
  }

  [
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
  });

  const setNowBtn = document.getElementById("setNowBtn");
  if (setNowBtn) {
    setNowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      document.getElementById("periodEnd").value = `${h}:${m}:${s}`;
      saveState();
    });
  }

  const calcBtn = document.getElementById("calcBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", (e) => {
      e.preventDefault();
      calculate();
      saveState();
    });
  }
});
