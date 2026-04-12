let activeTarget = null;
let onAirFlowArmed = false;

const STORAGE_KEYS = {
  billboardDuration: "billboard_duration",
  interviewHome: "interview_home",
  interviewAway: "interview_away",
  onAirTime: "on_air_time",
  matchTime: "match_time"
};

const DEFAULTS = {
  billboardDuration: 20,
  interviewHome: 0,
  interviewAway: 0
};

const targets = {
  onAir: null,
  match: null
};

const liveClockEl = document.getElementById("liveClock");
const countdownLabelEl = document.getElementById("countdownLabel");
const onAirCountdownEl = document.getElementById("onAirCountdown");
const countdownMetaEl = document.getElementById("countdownMeta");

const onAirBtn = document.getElementById("openOnAirPicker");
const matchBtn = document.getElementById("openMatchPicker");
const nextBtn = document.getElementById("nextBtn");

const billboardDisplayEl = document.getElementById("billboardDisplay");
const interviewDisplayEl = document.getElementById("interviewDisplay");
const occupiedDisplayEl = document.getElementById("occupiedDisplay");

const overlay = document.getElementById("timePickerOverlay");
const titleEl = document.getElementById("timePickerTitle");
const hSel = document.getElementById("pickerHours");
const mSel = document.getElementById("pickerMinutes");
const sSel = document.getElementById("pickerSeconds");

function getStoredNumber(key, fallback) {
  const raw = localStorage.getItem(key);

  if (raw === null) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function resetButtonsIfNeeded() {
  if (targets.onAir === null) {
    onAirBtn.textContent = "Ställ tid";
  }

  if (targets.match === null) {
    matchBtn.textContent = "Ställ tid";
  }
}

function saveTargetTimes() {
  if (targets.onAir === null) {
    localStorage.removeItem(STORAGE_KEYS.onAirTime);
  } else {
    localStorage.setItem(STORAGE_KEYS.onAirTime, String(targets.onAir));
  }

  if (targets.match === null) {
    localStorage.removeItem(STORAGE_KEYS.matchTime);
  } else {
    localStorage.setItem(STORAGE_KEYS.matchTime, String(targets.match));
  }
}

function loadTargetTimes() {
  const storedOnAir = localStorage.getItem(STORAGE_KEYS.onAirTime);
  const storedMatch = localStorage.getItem(STORAGE_KEYS.matchTime);

  targets.onAir = storedOnAir !== null ? Number(storedOnAir) : null;
  targets.match = storedMatch !== null ? Number(storedMatch) : null;

  if (!Number.isFinite(targets.onAir)) {
    targets.onAir = null;
  }

  if (!Number.isFinite(targets.match)) {
    targets.match = null;
  }

  if (targets.onAir !== null) {
    onAirBtn.textContent = toClock(targets.onAir);
    onAirFlowArmed = signedDiffToTarget(targets.onAir) > 0;
  } else {
    onAirFlowArmed = false;
  }

  if (targets.match !== null) {
    matchBtn.textContent = toClock(targets.match);
  }

  resetButtonsIfNeeded();
}

function getBillboardSeconds() {
  return getStoredNumber(STORAGE_KEYS.billboardDuration, DEFAULTS.billboardDuration);
}

function getInterviewTotalSeconds() {
  const home = getStoredNumber(STORAGE_KEYS.interviewHome, DEFAULTS.interviewHome);
  const away = getStoredNumber(STORAGE_KEYS.interviewAway, DEFAULTS.interviewAway);
  return home + away;
}

function nowSeconds() {
  const n = new Date();
  return n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
}

function toClock(sec) {
  const safe = ((sec % 86400) + 86400) % 86400;
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min ${seconds} s`;
  }

  if (minutes > 0) {
    return `${minutes} min ${seconds} s`;
  }

  return `${seconds} s`;
}

function formatMinutesSeconds(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function signedDiffToTarget(target) {
  return target - nowSeconds();
}

function updateLiveClock() {
  liveClockEl.textContent = toClock(nowSeconds());
}

function updateInfoPanel() {
  const billboardSeconds = getBillboardSeconds();
  const interviewSeconds = getInterviewTotalSeconds();
  const occupiedSeconds = billboardSeconds + interviewSeconds;

  billboardDisplayEl.textContent = formatMinutesSeconds(billboardSeconds);
  interviewDisplayEl.textContent = formatMinutesSeconds(interviewSeconds);
  occupiedDisplayEl.textContent = formatMinutesSeconds(occupiedSeconds);
}

function showCountdown(label, value, meta = "", warning = false) {
  countdownLabelEl.textContent = label;
  onAirCountdownEl.textContent = value;
  countdownMetaEl.textContent = meta;
  onAirCountdownEl.classList.toggle("warning", warning);
}

function updateCountdown() {
  if (targets.onAir === null) {
    showCountdown(
      "Nedräkning till sändning",
      "Ingen tid vald",
      "Ställ tider för att starta flödet",
      false
    );
    return;
  }

  const billboardSeconds = getBillboardSeconds();
  const diff = signedDiffToTarget(targets.onAir);

  if (diff > 0) {
    onAirFlowArmed = true;
    showCountdown(
      "Nedräkning till sändning",
      formatDuration(diff),
      `Billboard: ${formatMinutesSeconds(billboardSeconds)}`,
      diff <= 15
    );
    return;
  }

  if (onAirFlowArmed) {
    const billboardRemaining = billboardSeconds + diff;

    if (billboardRemaining > 0) {
      showCountdown(
        "Billboard",
        formatDuration(billboardRemaining),
        `Billboardlängd: ${formatMinutesSeconds(billboardSeconds)}`,
        true
      );
      return;
    }

    showCountdown("I sändning", "I sändning", "Billboard avslutad", true);
    return;
  }

  if (diff >= -60) {
    showCountdown("Sändning", "Sändning", "Start nyligen passerad", true);
    return;
  }

  showCountdown("Starttid passerad", "Starttid passerad", "Välj ny tid", true);
}

function tick() {
  updateLiveClock();
  updateInfoPanel();
  updateCountdown();
}

for (let i = 0; i < 24; i += 1) {
  hSel.add(new Option(String(i).padStart(2, "0"), String(i)));
}

for (let i = 0; i < 60; i += 1) {
  const value = String(i);
  const label = String(i).padStart(2, "0");
  mSel.add(new Option(label, value));
  sSel.add(new Option(label, value));
}

function openPicker(title, key) {
  activeTarget = key;
  titleEl.textContent = title;

  const current = targets[key] ?? nowSeconds();
  const safe = ((current % 86400) + 86400) % 86400;

  hSel.value = String(Math.floor(safe / 3600));
  mSel.value = String(Math.floor((safe % 3600) / 60));
  sSel.value = String(safe % 60);

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closePicker() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

document.getElementById("pickerCancel").addEventListener("click", closePicker);

document.getElementById("pickerSet").addEventListener("click", () => {
  const sec =
    Number(hSel.value) * 3600 +
    Number(mSel.value) * 60 +
    Number(sSel.value);

  if (activeTarget === "onAir") {
    targets.onAir = sec;
    onAirBtn.textContent = toClock(sec);
    onAirFlowArmed = signedDiffToTarget(sec) > 0;
  }

  if (activeTarget === "match") {
    targets.match = sec;
    matchBtn.textContent = toClock(sec);
  }

  saveTargetTimes();
  closePicker();
  updateCountdown();
});

onAirBtn.addEventListener("click", () => openPicker("Sändningsstart", "onAir"));
matchBtn.addEventListener("click", () => openPicker("Matchstart", "match"));

nextBtn.addEventListener("click", () => {
  window.location.href = "/pausinstallningar/";
});

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closePicker();
  }
});

window.addEventListener("storage", () => {
  loadTargetTimes();
  updateInfoPanel();
  updateCountdown();
});

loadTargetTimes();
tick();
setInterval(tick, 1000);