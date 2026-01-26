let activeTarget = null;
let targets = {};

function nowSeconds() {
  const n = new Date();
  return n.getHours()*3600 + n.getMinutes()*60 + n.getSeconds();
}

function toClock(sec) {
  const h = String(Math.floor(sec/3600)%24).padStart(2,"0");
  const m = String(Math.floor(sec%3600/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}

/* Live clock */
setInterval(() => {
  const n = new Date();
  document.getElementById("liveClock").textContent =
    toClock(n.getHours()*3600 + n.getMinutes()*60 + n.getSeconds());

  updateCountdowns();
}, 1000);

/* Countdown rendering */
function updateCountdowns() {
  for (const key in targets) {
    const diff = targets[key] - nowSeconds();
    const el = document.getElementById(key);
    if (!el) continue;
    el.textContent = diff <= 0 ? "Nu" : `Tid kvar: ${diff} s`;
  }
}

/* Scrollklocka */
const overlay = document.getElementById("timePickerOverlay");
const hSel = document.getElementById("pickerHours");
const mSel = document.getElementById("pickerMinutes");
const sSel = document.getElementById("pickerSeconds");

for (let i=0;i<24;i++) hSel.add(new Option(String(i).padStart(2,"0"), i));
for (let i=0;i<60;i++) {
  mSel.add(new Option(String(i).padStart(2,"0"), i));
  sSel.add(new Option(String(i).padStart(2,"0"), i));
}

function openPicker(title, targetKey) {
  activeTarget = targetKey;
  document.getElementById("timePickerTitle").textContent = title;
  overlay.style.display = "flex";
}

document.getElementById("pickerCancel").onclick = () => overlay.style.display="none";
document.getElementById("pickerSet").onclick = () => {
  const sec = Number(hSel.value)*3600 + Number(mSel.value)*60 + Number(sSel.value);
  targets[activeTarget] = sec;
  overlay.style.display="none";
};

/* Buttons */
document.getElementById("openOnAirPicker").onclick =
  () => openPicker("Sändningsstart", "onAirCountdown");

document.getElementById("openPausePicker").onclick =
  () => openPicker("Paus", "pauseCountdown");

document.getElementById("openManualAfterPausePicker").onclick =
  () => openPicker("Sändning efter paus", "manualAfterPauseCountdown");

document.getElementById("calcBtn").onclick = () => {
  document.getElementById("manualAfterPauseCard").style.display = "block";
};
