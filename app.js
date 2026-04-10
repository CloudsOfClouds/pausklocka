let activeTarget = null;
let onAirFlowArmed = false;

const BILLBOARD_SECONDS = 18;

const targets = {
  onAir: null,
  match: null,
};

const liveClockEl = document.getElementById("liveClock");
const countdownLabelEl = document.getElementById("countdownLabel");
const onAirCountdownEl = document.getElementById("onAirCountdown");
const onAirBtn = document.getElementById("openOnAirPicker");
const matchBtn = document.getElementById("openMatchPicker");
const nextBtn = document.getElementById("nextBtn");

const overlay = document.getElementById("timePickerOverlay");
const titleEl = document.getElementById("timePickerTitle");
const hSel = document.getElementById("pickerHours");
const mSel = document.getElementById("pickerMinutes");
const sSel = document.getElementById("pickerSeconds");

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
  const sec = Math.max(0, totalSeconds);
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

function signedDiffToTarget(target) {
  return target - nowSeconds();
}

function updateLiveClock() {
  liveClockEl.textContent = toClock(nowSeconds());
}

function showCountdown(label, value, warning = false) {
  countdownLabelEl.textContent = label;
  onAirCountdownEl.textContent = value;
  onAirCountdownEl.classList.toggle("warning", warning);
}

function updateCountdown() {
  if (targets.onAir === null) {
    showCountdown("Nedräkning till sändning", "Ingen tid vald", false);
    return;
  }

  const diff = signedDiffToTarget(targets.onAir);

  if (diff > 0) {
    onAirFlowArmed = true;
    showCountdown("Nedräkning till sändning", formatDuration(diff), diff <= 15);
    return;
  }

  if (onAirFlowArmed) {
    const billboardRemaining = BILLBOARD_SECONDS + diff;

    if (billboardRemaining > 0) {
      showCountdown("Billboard", formatDuration(billboardRemaining), false);
      return;
    }

    showCountdown("I sändning", "I sändning", true);
    return;
  }

  if (diff >= -60) {
    showCountdown("Sändning", "Sändning", true);
    return;
  }

  showCountdown("Starttid passerad", "Starttid passerad", true);
}

function tick() {
  updateLiveClock();
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

  closePicker();
  updateCountdown();
});

onAirBtn.addEventListener("click", () => openPicker("Sändningsstart", "onAir"));
matchBtn.addEventListener("click", () => openPicker("Matchstart", "match"));

nextBtn.addEventListener("click", () => {
  alert("Sida 2 är inte byggd ännu.");
});

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closePicker();
  }
});

tick();
setInterval(tick, 1000);
