let activeTargetKey = null;

const TARGET_KEYS = {
  onAirCountdown: "Sändningsstart",
  pauseCountdown: "Paus",
  manualAfterPauseCountdown: "Sändning efter paus"
};

const targets = {
  onAirCountdown: null,
  pauseCountdown: null,
  manualAfterPauseCountdown: null,

  billboardCountdown: null,
  talkWindow: null,
  matchCountdown: null
};

function nowSeconds() {
  const n = new Date();
  return n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
}

function toClock(sec) {
  const h = String(Math.floor(sec / 3600) % 24).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatCountdown(diffSeconds) {
  const d = Math.max(0, diffSeconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setLiveClock() {
  const n = new Date();
  document.getElementById("liveClock").textContent = toClock(
    n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()
  );
}

function saveTargets() {
  const payload = {
    targets,
    showManualAfterPause: document.getElementById("manualAfterPauseCard").style.display !== "none"
  };
  localStorage.setItem("pausklocka_v6_1", JSON.stringify(payload));
}

function loadTargets() {
  const raw = localStorage.getItem("pausklocka_v6_1");
  if (!raw) return;

  try {
    const payload = JSON.parse(raw);
    if (payload && payload.targets) {
      for (const k in targets) {
        if (Object.prototype.hasOwnProperty.call(payload.targets, k)) {
          targets[k] = payload.targets[k];
        }
      }
    }
    if (payload && payload.showManualAfterPause) {
      document.getElementById("manualAfterPauseCard").style.display = "block";
    }
  } catch (e) {
  }
}

function getDiffToTarget(targetSec) {
  if (targetSec === null || targetSec === undefined) return null;

  let diff = targetSec - nowSeconds();

  if (diff < 0) diff += 86400;

  return diff;
}

function renderTimer(id, diff) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove("is-now", "is-empty");

  if (diff === null) {
    el.textContent = "--:--";
    el.classList.add("is-empty");
    return;
  }

  if (diff <= 0) {
    el.textContent = "Nu";
    el.classList.add("is-now");
    return;
  }

  el.textContent = formatCountdown(diff);
}

function updateCountdowns() {
  for (const key in targets) {
    if (!Object.prototype.hasOwnProperty.call(targets, key)) continue;

    const targetSec = targets[key];

    if (key === "billboardCountdown" || key === "talkWindow" || key === "matchCountdown") {
      renderTimer(key, null);
      continue;
    }

    const diff = getDiffToTarget(targetSec);
    renderTimer(key, diff);
  }
}

const overlay = document.getElementById("timePickerOverlay");
const hSel = document.getElementById("pickerHours");
const mSel = document.getElementById("pickerMinutes");
const sSel = document.getElementById("pickerSeconds");

for (let i = 0; i < 24; i++) hSel.add(new Option(String(i).padStart(2, "0"), i));
for (let i = 0; i < 60; i++) {
  mSel.add(new Option(String(i).padStart(2, "0"), i));
  sSel.add(new Option(String(i).padStart(2, "0"), i));
}

function prefillPickerFromTarget(targetKey) {
  const existing = targets[targetKey];
  if (existing === null || existing === undefined) return;

  const h = Math.floor(existing / 3600) % 24;
  const m = Math.floor((existing % 3600) / 60);
  const s = existing % 60;

  hSel.value = String(h);
  mSel.value = String(m);
  sSel.value = String(s);
}

function openPicker(title, targetKey) {
  activeTargetKey = targetKey;
  document.getElementById("timePickerTitle").textContent = title;
  prefillPickerFromTarget(targetKey);
  overlay.style.display = "flex";
}

document.getElementById("pickerCancel").onclick = () => {
  overlay.style.display = "none";
};

document.getElementById("pickerSet").onclick = () => {
  if (!activeTargetKey) return;

  const sec =
    Number(hSel.value) * 3600 +
    Number(mSel.value) * 60 +
    Number(sSel.value);

  targets[activeTargetKey] = sec;

  overlay.style.display = "none";
  saveTargets();
  updateCountdowns();
};

document.getElementById("openOnAirPicker").onclick = () =>
  openPicker("Sändningsstart", "onAirCountdown");

document.getElementById("openPausePicker").onclick = () =>
  openPicker("Paus", "pauseCountdown");

document.getElementById("openManualAfterPausePicker").onclick = () =>
  openPicker("Sändning efter paus", "manualAfterPauseCountdown");

document.getElementById("calcBtn").onclick = () => {
  document.getElementById("manualAfterPauseCard").style.display = "block";
  saveTargets();
};

function tick() {
  setLiveClock();
  updateCountdowns();
}

loadTargets();
tick();
setInterval(tick, 1000);
