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
 */
function updateManualOnAirCountdown() {
  const input = document.getElementById("manualOnAir");
  const box = document.getElementById("manualOnAirBox");
  const labelOnAir = document.getElementById("manualOnAirCountdown");
  const labelBillboard = document.getElementById("manualBillboardCountdown");
  const billboardInput = document.getElementById("billboard");

  if (!input || !box || !labelOnAir || !labelBillboard || !billboardInput) return;

  const manualValue = input.value;
  const billboardStr = billboardInput.value;

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
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diff = targetSeconds - nowSeconds;

  box.style.display = "block";

  if (diff > 0) {
    manualPhase = "before";
    manualBillboardEndSeconds = null;
    labelOnAir.textContent =
      "Nedräkning till sändningsstart: " + diffToCountdownString(diff);
    labelBillboard.textContent = "";
    return;
  }

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

  if (manualPhase === "billboard" && manualBillboardEndSeconds !== null) {
    const remaining = manualBillboardEndSeconds - nowSeconds;
    if (remaining <= 0) {
      manualPhase = "done";
      labelBillboard.textContent = "Billboard + vinjett: Klar";
    } else {
      labelBillboard.textContent =
        "Nedräkning billboard + vinjett: " +
        diffToCountdownString(remaining);
    }
  } else if (manualPhase === "done") {
    if (billboardStr && parseDurationToSeconds(billboardStr) > 0) {
      labelBillboard.textContent = "Billboard + vinjett: Klar";
    } else {
      labelBillboard.textContent = "";
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
  const homeStr = document.getElementById("interviewHome").value;
  const awayStr = document.getElementById("interviewAway").value;
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

/* ---------- TÄTHETS-TEXT (som i referensen) ---------- */

function setTightnessMessage(diffSeconds) {
  const el = document.getElementById("tightness");
  if (!el) return;

  el.className = "tightness";

  const absStr = secondsToCountdownString(Math.abs(diffSeconds));

  if (diffSeconds < 0) {
    el.textContent =
      `Röd: Paketet är längre än pausen, kapa cirka <span class="time-number">${absStr}</span>.`;
    el.classList.add("tightness-bad");
  } else if (diffSeconds <= 60) {
    el.textContent =
      "Grön: Du ligger väldigt nära paustiden, tajt men okej.";
    el.classList.add("tightness-good");
  } else {
    el.textContent =
      `Grön: Du har gott om marginal, +<span class="time-number">${absStr}</span> utöver paketet.`;
    el.classList.add("tightness-good");
  }
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
  const pauseStr = document.getElementById("pauseMinutes").value || "";
  const billboardStr = document.getElementById("billboard").value || "";
  const highlightsStr = document.getElementById("highlights").value || "";
  const talkStr = document.getElementById("talk").value || "";
  const interviewHomeStr = document.getElementById("interviewHome").value || "";
  const interviewAwayStr = document.getElementById("interviewAway").value || "";

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

  const contentSeconds =
    billboardSeconds + highlightsSeconds + talkSeconds;
  const totalContentSeconds = contentSeconds + interviewTotalSeconds;

  const periodStartSeconds = periodEndSeconds + pauseSeconds;
  const onAirSeconds = periodStartSeconds - contentSeconds;

  const billboardStartSeconds = onAirSeconds;
  const highlightsStartSeconds = billboardStartSeconds + billboardSeconds;
  const talkStartSeconds = highlightsStartSeconds + highlightsSeconds;
  const interviewsStartSeconds = talkStartSeconds + talkSeconds;

  // Skillnad mot paketet (utan intervjuer), som i referensbilden
  const diffSeconds = pauseSeconds - contentSeconds;

  const lines = [];

  lines.push(
    `<p><strong>Beräknad periodstart:</strong> ` +
      `<span class="time-number">${secondsToClock(periodStartSeconds)}</span></p>`
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
  lines.push(
    `<p><strong>Billboard + vinjett start:</strong> ` +
      `<span class="time-number">${secondsToClock(
        billboardStartSeconds
      )}</span></p>`
  );
  lines.push(
    `<p><strong>Höjdpunkter start:</strong> ` +
      `<span class="time-number">${secondsToClock(
        highlightsStartSeconds
      )}</span></p>`
  );
  lines.push(
    `<p><strong>Extra prat start:</strong> ` +
      `<span class="time-number">${secondsToClock(
        talkStartSeconds
      )}</span></p>`
  );
  lines.push(
    `<p><strong>Intervjupaket start:</strong> ` +
      `<span class="time-number">${secondsToClock(
        interviewsStartSeconds
      )}</span> (${secondsToCountdownString(
        interviewTotalSeconds
      )})</p>`
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
      now.getHours() * 3600 +
      now.getMinutes() * 60 +
      now.getSeconds();

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
      billboard: document.getElementById("billboard")?.value || "",
      highlights: document.getElementById("highlights")?.value || "",
      talk: document.getElementById("talk")?.value || "",
      interviewHome: document.getElementById("interviewHome")?.value || "",
      interviewAway: document.getElementById("interviewAway")?.value || "",
      manualOnAir: document.getElementById("manualOnAir")?.value || ""
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
    const evt =
      el.tagName === "SELECT" || el.type === "number" ? "change" : "input";
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
      const periodEndInput = document.getElementById("periodEnd");
      if (periodEndInput) {
        periodEndInput.value = `${h}:${m}:${s}`;
        saveState();
      }
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
