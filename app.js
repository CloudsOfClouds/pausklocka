let countdownTimer = null;
let manualPhase = "before"; // "before", "billboard", "done"
let manualBillboardEndSeconds = null;

const STORAGE_KEY = "pausePlannerStateV4";

/* ---------- HJÄLPFUNKTIONER ---------- */

// Klockslag HH:MM eller HH:MM:SS -> sekunder från midnatt
function parseClockToSeconds(str) {
  if (!str) return null;
  str = str.trim();
  const parts = str.split(":").map((p) => Number(p));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  const h = parts[0];
  const m = parts[1];
  const s = parts[2] ?? 0;
  return h * 3600 + m * 60 + s;
}

// Längder: mm, mm:ss eller hh:mm:ss -> sekunder
function parseDurationToSeconds(str) {
  if (!str) return 0;
  str = str.trim().replace(",", ":").replace(".", ":");
  if (!str) return 0;
  const parts = str.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 1) {
    // "5" -> 5 minuter
    return parts[0] * 60;
  }
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

function secondsToCountdownString(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return "";
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return `${h} h ${m} min ${s} s`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

function diffToCountdownString(diffSeconds) {
  if (diffSeconds <= 0) return "Nu";
  return secondsToCountdownString(diffSeconds);
}

// Sekunder från midnatt -> HH:MM:SS
function secondsToClock(totalSeconds) {
  totalSeconds = ((totalSeconds % 86400) + 86400) % 86400; // wrap runt dygn
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
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

    updateManualOnAirCountdown();

    const msToNextSecond = 1000 - now.getMilliseconds();
    setTimeout(updateClock, msToNextSecond);
  }

  updateClock();
}

/**
 * 1) Nedräkning till sändningsstart (manualOnAir)
 * 2) När noll: nedräkning på billboard + vinjett
 * 3) Statisk pratfönster mellan sändningsstart och matchstart
 *    efter billboard + intervjuer
 * 4) Nedräkning till matchstart
 */
function updateManualOnAirCountdown() {
  const input = document.getElementById("manualOnAir");
  const matchInput = document.getElementById("manualMatchStart");
  const box = document.getElementById("manualOnAirBox");
  const labelOnAir = document.getElementById("manualOnAirCountdown");
  const labelBillboard = document.getElementById("manualBillboardCountdown");
  const talkWindowEl = document.getElementById("manualTalkWindow");
  const matchCountdownEl = document.getElementById("manualMatchCountdown");
  const billboardInput = document.getElementById("billboard");
  const card = document.getElementById("manualOnAirCard");

  if (
    !input ||
    !box ||
    !labelOnAir ||
    !labelBillboard ||
    !billboardInput ||
    !talkWindowEl ||
    !matchCountdownEl
  ) {
    return;
  }

  // Nollställ visuellt läge
  if (card) {
    card.classList.remove("card-alert-danger");
  }
  labelOnAir.classList.remove("countdown-danger");
  matchCountdownEl.classList.remove("countdown-danger");
  talkWindowEl.textContent = "";
  matchCountdownEl.textContent = "";

  const manualValue = input.value;
  const billboardStr = billboardInput.value;
  const matchValue = matchInput ? matchInput.value : "";

  // Inget manuellt klockslag
  if (!manualValue) {
    box.style.display = "none";
    labelOnAir.textContent = "";
    labelBillboard.textContent = "";
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    return;
  }

  const targetSeconds = parseClockToSeconds(manualValue);
  if (targetSeconds === null) {
    box.style.display = "none";
    labelOnAir.textContent = "";
    labelBillboard.textContent = "";
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    return;
  }

  const now = new Date();
  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diff = targetSeconds - nowSeconds;

  box.style.display = "block";

  // Mer än 15 sek kvar: vanlig nedräkning
  if (diff > 15) {
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    labelOnAir.textContent =
      "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
    labelBillboard.textContent = "";
  } else if (diff > 0) {
    // Sista 15 sekunderna: gör klockan röd
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    labelOnAir.textContent =
      "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
    labelOnAir.classList.add("countdown-danger");
    labelBillboard.textContent = "";
  } else {
    // Vid eller efter sändningsstart
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
    labelOnAir.classList.add("countdown-danger");

    // Billboardfas
    if (manualPhase === "billboard" && manualBillboardEndSeconds !== null) {
      const remaining = manualBillboardEndSeconds - nowSeconds;

      if (remaining <= 0) {
        manualPhase = "done";
        labelBillboard.textContent = "Billboard + vinjett: Klar";
        if (card) {
          card.classList.remove("card-alert-danger");
        }
      } else {
        labelBillboard.textContent =
          "Nedräkning billboard + vinjett: " + diffToCountdownString(remaining);
        if (card) {
          // Pulsera hela kortet medan billboard rullar
          card.classList.add("card-alert-danger");
        }
      }
    } else if (manualPhase === "done") {
      if (billboardStr && parseDurationToSeconds(billboardStr) > 0) {
        labelBillboard.textContent = "Billboard + vinjett: Klar";
      } else {
        labelBillboard.textContent = "";
      }
      if (card) {
        card.classList.remove("card-alert-danger");
      }
    }
  }

  // Nedräkning till matchstart
  let matchSeconds = null;
  if (matchValue) {
    matchSeconds = parseClockToSeconds(matchValue);
  }

  if (matchSeconds !== null) {
    const diffMatch = matchSeconds - nowSeconds;
    if (diffMatch > 15) {
      matchCountdownEl.textContent =
        "Nedräkning till matchstart: " + diffToCountdownString(diffMatch);
    } else if (diffMatch > 0) {
      matchCountdownEl.textContent =
        "Nedräkning till matchstart: " + diffToCountdownString(diffMatch);
      matchCountdownEl.classList.add("countdown-danger");
    } else {
      matchCountdownEl.textContent = "Nedräkning till matchstart: Nu";
      matchCountdownEl.classList.add("countdown-danger");
    }
  } else {
    matchCountdownEl.textContent = "";
  }

  // Statisk pratfönster mellan sändningsstart och matchstart
  if (matchSeconds !== null && matchSeconds > targetSeconds) {
    const totalWindow = matchSeconds - targetSeconds; // hela fönstret från on-air till nedsläpp
    const billboardSeconds = parseDurationToSeconds(billboardStr);

    const interviewHomeStr =
      document.getElementById("interviewHome")?.value || "";
    const interviewAwayStr =
      document.getElementById("interviewAway")?.value || "";
    const interviewSeconds =
      parseMMSS(interviewHomeStr) + parseMMSS(interviewAwayStr);

    const afterBillboardAndInterviews =
      totalWindow - (billboardSeconds + interviewSeconds);

    if (afterBillboardAndInterviews <= 0) {
      talkWindowEl.textContent =
        "Tid för prat efter billboard + intervjuer: 0 s";
    } else {
      talkWindowEl.textContent =
        "Tid för prat efter billboard + intervjuer: " +
        secondsToCountdownString(afterBillboardAndInterviews);
    }
  }
}

/* ---------- INTERVJUPAKET ---------- */

function parseMMSS(str) {
  if (!str) return 0;
  str = str.trim().replace(",", ":").replace(".", ":");
  const parts = str.split(":").map((p) => Number(p));
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
  const homeStr = document.getElementById("interviewHome")?.value || "";
  const awayStr = document.getElementById("interviewAway")?.value || "";
  const total = parseMMSS(homeStr) + parseMMSS(awayStr);
  const el = document.getElementById("interviewTotal");
  if (el) el.textContent = formatMMSS(total);
}

/* ---------- PRESETS ---------- */

function applyPreset(preset) {
  const pauseInput = document.getElementById("pauseMinutes");
  const billboardInput = document.getElementById("billboard");
  const highlightsInput = document.getElementById("highlights");
  const talkInput = document.getElementById("talk");

  if (!pauseInput || !billboardInput || !highlightsInput || !talkInput) return;

  if (!preset) return;

  if (preset === "bandy_18") {
    pauseInput.value = "18:00";
    billboardInput.value = "1:20";
    highlightsInput.value = "";
    talkInput.value = "";
  } else if (preset === "innebandy_15") {
    pauseInput.value = "15:00";
    billboardInput.value = "0:18";
    highlightsInput.value = "";
    talkInput.value = "";
  } else if (preset === "fotboll_15") {
    pauseInput.value = "15:00";
    billboardInput.value = "0:30";
    highlightsInput.value = "";
    talkInput.value = "";
  }
}

/* ---------- TÄTHETS-TEXT MED BLÅ TIDER ---------- */

function setTightnessMessage(diffSeconds) {
  const el = document.getElementById("tightness");
  if (!el) return;

  el.className = "tightness";

  const absStr = secondsToCountdownString(Math.abs(diffSeconds));

  if (diffSeconds < 0) {
    el.innerHTML =
      `Röd: Paketet är längre än pausen, kapa cirka <span class="time-number">${absStr}</span>.`;
    el.classList.add("tightness-bad");
  } else if (diffSeconds <= 60) {
    el.innerHTML =
      "Grön: Du ligger väldigt nära paustiden, tajt men okej.";
    el.classList.add("tightness-good");
  } else {
    el.innerHTML =
      `Grön: Du har gott om marginal, +<span class="time-number">${absStr}</span> utöver paketet.`;
    el.classList.add("tightness-good");
  }
}

function resetPreviousPeriod() {
  const periodEndInput = document.getElementById("periodEnd");
  const highlightsInput = document.getElementById("highlights");
  const talkInput = document.getElementById("talk");

  if (periodEndInput) periodEndInput.value = "";
  if (highlightsInput) highlightsInput.value = "";
  if (talkInput) talkInput.value = "";

  // Töm resultat och göm output-kortet
  const resultLinesEl = document.getElementById("resultLines");
  const outputBox = document.getElementById("output");
  if (resultLinesEl) resultLinesEl.innerHTML = "";
  if (outputBox) outputBox.style.display = "none";

  // Töm tightness-rutan
  const tightnessEl = document.getElementById("tightness");
  if (tightnessEl) {
    tightnessEl.textContent = "";
    tightnessEl.className = "tightness";
  }

  // Stoppa nedräkning och nolla texterna
  const countdownOnAirEl = document.getElementById("countdownOnAir");
  const countdownPeriodEl = document.getElementById("countdownPeriod");

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (countdownOnAirEl) countdownOnAirEl.textContent = "";
  if (countdownPeriodEl) countdownPeriodEl.textContent = "";
}

/* ---------- HUVUDKALKYL ---------- */

function calculate() {
  const resultLinesEl = document.getElementById("resultLines");
  const outputBox = document.getElementById("output");
  if (!resultLinesEl) return;

  if (outputBox) {
    outputBox.style.display = "block";
  }

  resultLinesEl.innerHTML = "";

  const periodEndStr = document.getElementById("periodEnd").value;
  const pauseOfficialStr =
    document.getElementById("pauseMinutes").value || "";
  const pauseOverrideStr =
    document.getElementById("pauseOverride").value || "";
  const pauseStr = pauseOverrideStr || pauseOfficialStr;

  const billboardStr = document.getElementById("billboard").value || "";
  const highlightsStr = document.getElementById("highlights").value || "";
  const talkStr = document.getElementById("talk").value || "";
  const interviewHomeStr =
    document.getElementById("interviewHome").value || "";
  const interviewAwayStr =
    document.getElementById("interviewAway").value || "";

  const periodEndSeconds = parseClockToSeconds(periodEndStr);
  if (periodEndSeconds === null) {
    resultLinesEl.innerHTML =
      "<p>Ange tid när perioden slutade (HH:MM eller HH:MM:SS).</p>";
    setTightnessMessage(0);
    return;
  }

  const pauseSeconds = parseDurationToSeconds(pauseStr);
  const billboardSeconds = parseDurationToSeconds(billboardStr);
  const highlightsSeconds = parseDurationToSeconds(highlightsStr);
  const talkSeconds = parseDurationToSeconds(talkStr);
  const interviewHomeSeconds = parseMMSS(interviewHomeStr);
  const interviewAwaySeconds = parseMMSS(interviewAwayStr);
  const interviewTotalSeconds = interviewHomeSeconds + interviewAwaySeconds;

  const contentSeconds = billboardSeconds + highlightsSeconds + talkSeconds;
  const totalContentSeconds = contentSeconds + interviewTotalSeconds;

  const periodStartSeconds = periodEndSeconds + pauseSeconds;
  const onAirSeconds = periodStartSeconds - contentSeconds;

  const billboardStartSeconds = onAirSeconds;
  const highlightsStartSeconds = billboardStartSeconds + billboardSeconds;
  const talkStartSeconds = highlightsStartSeconds + highlightsSeconds;
  const interviewsStartSeconds = talkStartSeconds + talkSeconds;

  // Skillnad mot paketet (utan intervjuer)
  const diffSeconds = pauseSeconds - contentSeconds;

  const lines = [];

  lines.push(
    `<p><strong>Beräknad periodstart:</strong> ` +
      `<span class="time-number">${secondsToClock(
        periodStartSeconds
      )}</span></p>`
  );
  lines.push(
    `<p><strong>Rekommenderad sändningsstart:</strong> ` +
      `<span class="time-number">${secondsToClock(onAirSeconds)}</span></p>`
  );
  lines.push(
    `<p><strong>Totalt innehåll (billboard + highlights + prat):</strong> ` +
      `<span class="time-number">${secondsToCountdownString(
        contentSeconds
      )}</span></p>`
  );

  resultLinesEl.innerHTML = lines.join("\n");

  setTightnessMessage(diffSeconds);

  const countdownOnAirEl = document.getElementById("countdownOnAir");
  const countdownPeriodEl = document.getElementById("countdownPeriod");

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  function updateCountdowns() {
    const now = new Date();
    const nowSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    if (countdownOnAirEl) {
      const diffOnAir = onAirSeconds - nowSeconds;
      if (diffOnAir <= 0) {
        countdownOnAirEl.textContent = "Till sändningsstart: Nu";
      } else {
        countdownOnAirEl.textContent =
          "Till sändningsstart: " +
          diffToCountdownString(diffOnAir) +
          " kvar";
      }
    }

    if (countdownPeriodEl) {
      const diffPeriod = periodStartSeconds - nowSeconds;
      if (diffPeriod <= 0) {
        countdownPeriodEl.textContent = "Till periodstart: Nu";
      } else {
        countdownPeriodEl.textContent =
          "Till periodstart: " +
          diffToCountdownString(diffPeriod) +
          " kvar";
      }
    }
  }

  updateCountdowns();
  countdownTimer = setInterval(updateCountdowns, 1000);
}

/* ---------- AUTOSAVE ---------- */

function saveState() {
  try {
    const state = {
      preset: document.getElementById("preset")?.value || "",
      periodEnd: document.getElementById("periodEnd")?.value || "",
      pauseMinutes: document.getElementById("pauseMinutes")?.value || "",
      pauseOverride: document.getElementById("pauseOverride")?.value || "",
      billboard: document.getElementById("billboard")?.value || "",
      highlights: document.getElementById("highlights")?.value || "",
      talk: document.getElementById("talk")?.value || "",
      interviewHome: document.getElementById("interviewHome")?.value || "",
      interviewAway: document.getElementById("interviewAway")?.value || "",
      manualOnAir: document.getElementById("manualOnAir")?.value || "",
      manualMatchStart:
        document.getElementById("manualMatchStart")?.value || ""
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

    if (state.preset !== undefined) {
      const presetSelect = document.getElementById("preset");
      if (presetSelect) presetSelect.value = state.preset;
    }
    if (state.periodEnd !== undefined) {
      const el = document.getElementById("periodEnd");
      if (el) el.value = state.periodEnd;
    }
    if (state.pauseMinutes !== undefined) {
      const el = document.getElementById("pauseMinutes");
      if (el) el.value = state.pauseMinutes;
    }
    if (state.billboard !== undefined) {
      const el = document.getElementById("billboard");
      if (el) el.value = state.billboard;
    }
    if (state.highlights !== undefined) {
      const el = document.getElementById("highlights");
      if (el) el.value = state.highlights;
    }
    if (state.talk !== undefined) {
      const el = document.getElementById("talk");
      if (el) el.value = state.talk;
    }
    if (state.interviewHome !== undefined) {
      const el = document.getElementById("interviewHome");
      if (el) el.value = state.interviewHome;
    }
    if (state.interviewAway !== undefined) {
      const el = document.getElementById("interviewAway");
      if (el) el.value = state.interviewAway;
    }
    if (state.manualOnAir !== undefined) {
      const el = document.getElementById("manualOnAir");
      if (el) el.value = state.manualOnAir;
    }
    if (state.manualMatchStart !== undefined) {
      const el = document.getElementById("manualMatchStart");
      if (el) el.value = state.manualMatchStart;
    }
    if (state.pauseOverride !== undefined) {
      const el = document.getElementById("pauseOverride");
      const disp = document.getElementById("pauseOverrideDisplay");
      if (el) el.value = state.pauseOverride;
      if (disp) disp.textContent = state.pauseOverride || "–:–";
    }

    updateInterviewTotal();
    updateManualOnAirCountdown();
  } catch (e) {
    console.warn("Kunde inte läsa state", e);
  }
}

/* ---------- SCROLLKLOCKA FÖR PAUS ---------- */
function initPausePicker() {
  const overlay = document.getElementById("pausePickerOverlay");
  const btnOpen = document.getElementById("openPausePicker");
  const btnCancel = document.getElementById("pausePickerCancel");
  const btnSet = document.getElementById("pausePickerSet");
  const selMin = document.getElementById("pausePickerMinutes");
  const selSec = document.getElementById("pausePickerSeconds");
  const hiddenInput = document.getElementById("pauseOverride");
  const display = document.getElementById("pauseOverrideDisplay");
  const officialInput = document.getElementById("pauseMinutes");

  if (
    !overlay ||
    !btnOpen ||
    !btnCancel ||
    !btnSet ||
    !selMin ||
    !selSec ||
    !hiddenInput ||
    !display
  ) {
    return;
  }

  // Fyll med 0–30 minuter
  selMin.innerHTML = "";
  for (let m = 0; m <= 30; m++) {
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = String(m).padStart(2, "0");
    selMin.appendChild(opt);
  }

  // Fyll med 0–59 sekunder
  selSec.innerHTML = "";
  for (let s = 0; s < 60; s++) {
    const opt = document.createElement("option");
    opt.value = String(s);
    opt.textContent = String(s).padStart(2, "0");
    selSec.appendChild(opt);
  }

  function openWithCurrentValue() {
    let baseStr =
      hiddenInput.value ||
      officialInput?.value ||
      "15:00";

    baseStr = baseStr.trim().replace(",", ":").replace(".", ":");
    const parts = baseStr.split(":").map((p) => Number(p));
    let m = 0;
    let s = 0;
    if (parts.length >= 2 && !parts.some((n) => Number.isNaN(n))) {
      m = parts[0];
      s = parts[1];
    }

    selMin.value = String(Math.min(Math.max(m, 0), 30));
    selSec.value = String(Math.min(Math.max(s, 0), 59));

    overlay.style.display = "flex";
  }

  btnOpen.addEventListener("click", () => {
    openWithCurrentValue();
  });

  btnCancel.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  btnSet.addEventListener("click", () => {
    const m = Number(selMin.value);
    const s = Number(selSec.value);
    const str = `${m}:${String(s).padStart(2, "0")}`;
    hiddenInput.value = str;
    display.textContent = str;
    overlay.style.display = "none";
    saveState();
  });
}

/* ---------- SCROLLKLOCKA FÖR SÄNDNINGSSTART ---------- */

function initManualOnAirPicker() {
  const overlay = document.getElementById("manualOnAirPickerOverlay");
  const btnOpen = document.getElementById("openManualOnAirPicker");
  const btnCancel = document.getElementById("manualOnAirPickerCancel");
  const btnSet = document.getElementById("manualOnAirPickerSet");
  const selH = document.getElementById("manualOnAirPickerHours");
  const selM = document.getElementById("manualOnAirPickerMinutes");
  const selS = document.getElementById("manualOnAirPickerSeconds");
  const input = document.getElementById("manualOnAir");

  if (
    !overlay ||
    !btnOpen ||
    !btnCancel ||
    !btnSet ||
    !selH ||
    !selM ||
    !selS ||
    !input
  ) {
    return;
  }

  // 0–23 timmar
  selH.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement("option");
    opt.value = String(h);
    opt.textContent = String(h).padStart(2, "0");
    selH.appendChild(opt);
  }

  // 0–59 minuter
  selM.innerHTML = "";
  for (let m = 0; m < 60; m++) {
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = String(m).padStart(2, "0");
    selM.appendChild(opt);
  }

  // 0–59 sekunder
  selS.innerHTML = "";
  for (let s = 0; s < 60; s++) {
    const opt = document.createElement("option");
    opt.value = String(s);
    opt.textContent = String(s).padStart(2, "0");
    selS.appendChild(opt);
  }

  function openWithCurrentValue() {
    let baseStr = input.value;

    if (!baseStr) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      baseStr = `${h}:${m}:${s}`;
    }

    baseStr = baseStr.trim();
    const parts = baseStr.split(":").map((p) => Number(p));
    let h = 0;
    let m = 0;
    let s = 0;

    if (parts.length >= 2 && !parts.some((n) => Number.isNaN(n))) {
      h = parts[0];
      m = parts[1];
      s = parts[2] ?? 0;
    }

    selH.value = String(Math.min(Math.max(h, 0), 23));
    selM.value = String(Math.min(Math.max(m, 0), 59));
    selS.value = String(Math.min(Math.max(s, 0), 59));

    overlay.style.display = "flex";
  }

  btnOpen.addEventListener("click", () => {
    openWithCurrentValue();
  });

  btnCancel.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  btnSet.addEventListener("click", () => {
    const h = Number(selH.value);
    const m = Number(selM.value);
    const s = Number(selS.value);

    const hStr = String(h).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");

    input.value = `${hStr}:${mStr}:${sStr}`;
    overlay.style.display = "none";

    manualPhase = "before";
    manualBillboardEndSeconds = null;
    updateManualOnAirCountdown();
    saveState();
  });
}

/* ---------- SCROLLKLOCKA FÖR MATCHSTART ---------- */

function initManualMatchStartPicker() {
  const overlay = document.getElementById("manualMatchStartPickerOverlay");
  const btnOpen = document.getElementById("openManualMatchStartPicker");
  const btnCancel = document.getElementById("manualMatchStartPickerCancel");
  const btnSet = document.getElementById("manualMatchStartPickerSet");
  const selH = document.getElementById("manualMatchStartPickerHours");
  const selM = document.getElementById("manualMatchStartPickerMinutes");
  const selS = document.getElementById("manualMatchStartPickerSeconds");
  const input = document.getElementById("manualMatchStart");

  if (
    !overlay ||
    !btnOpen ||
    !btnCancel ||
    !btnSet ||
    !selH ||
    !selM ||
    !selS ||
    !input
  ) {
    return;
  }

  // 0–23 timmar
  selH.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement("option");
    opt.value = String(h);
    opt.textContent = String(h).padStart(2, "0");
    selH.appendChild(opt);
  }

  // 0–59 minuter
  selM.innerHTML = "";
  for (let m = 0; m < 60; m++) {
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = String(m).padStart(2, "0");
    selM.appendChild(opt);
  }

  // 0–59 sekunder
  selS.innerHTML = "";
  for (let s = 0; s < 60; s++) {
    const opt = document.createElement("option");
    opt.value = String(s);
    opt.textContent = String(s).padStart(2, "0");
    selS.appendChild(opt);
  }

  function openWithCurrentValue() {
    let baseStr = input.value;

    if (!baseStr) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      baseStr = `${h}:${m}:${s}`;
    }

    baseStr = baseStr.trim();
    const parts = baseStr.split(":").map((p) => Number(p));
    let h = 0;
    let m = 0;
    let s = 0;

    if (parts.length >= 2 && !parts.some((n) => Number.isNaN(n))) {
      h = parts[0];
      m = parts[1];
      s = parts[2] ?? 0;
    }

    selH.value = String(Math.min(Math.max(h, 0), 23));
    selM.value = String(Math.min(Math.max(m, 0), 59));
    selS.value = String(Math.min(Math.max(s, 0), 59));

    overlay.style.display = "flex";
  }

  btnOpen.addEventListener("click", () => {
    openWithCurrentValue();
  });

  btnCancel.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  btnSet.addEventListener("click", () => {
    const h = Number(selH.value);
    const m = Number(selM.value);
    const s = Number(selS.value);

    const hStr = String(h).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");

    input.value = `${hStr}:${mStr}:${sStr}`;
    overlay.style.display = "none";

    updateManualOnAirCountdown();
    saveState();
  });
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  startLiveClock();
  initPausePicker();
  initManualOnAirPicker();
  initManualMatchStartPicker();

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
    "manualOnAir",
    "manualMatchStart"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt =
      el.tagName === "SELECT" || el.type === "number" ? "change" : "input";
    el.addEventListener(evt, () => {
      if (id === "interviewHome" || id === "interviewAway") {
        updateInterviewTotal();
      }
      if (
        id === "manualOnAir" ||
        id === "billboard" ||
        id === "manualMatchStart" ||
        id === "interviewHome" ||
        id === "interviewAway"
      ) {
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
      const periodEndInput = document.getElementById("periodEnd");
      if (periodEndInput) {
        periodEndInput.value = `${h}:${m}:${s}`;
        saveState();
      }
    });
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetPreviousPeriod();
      
      // Nollställ scrollklockan (aktuell paus)
      const pauseOverride = document.getElementById("pauseOverride");
      const pauseOverrideDisplay = document.getElementById("pauseOverrideDisplay");

      if (pauseOverride) pauseOverride.value = "";
      if (pauseOverrideDisplay) pauseOverrideDisplay.textContent = "–:–";

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