const LS_KEY = "pausplanerare_v6_2";

const el = (id) => document.getElementById(id);

const state = {
  onAirTime: "00:00:00",
  periodEnd: "00:00:00",

  pauseLenSchema: "18:00",
  pauseLenActual: "18:00",

  billboard: "00:30",
  highlights: "00:00",
  extraTalk: "00:00",

  homeInterview: "00:00",
  awayInterview: "00:00",

  manualAfterPauseTime: "00:00:00",

  calcDone: false,
  preset: "none"
};

let pickerMode = null; // "hms" eller "ms"
let pickerTarget = null;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hmsToSeconds(hms) {
  const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(hms);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function msToSeconds(ms) {
  const m = /^(\d{2}):(\d{2})$/.exec(ms);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function secondsToHMS(sec) {
  const s = ((sec % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(r)}`;
}

function secondsToMS(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${pad2(m)}:${pad2(r)}`;
}

function nowSeconds() {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function countdownTo(targetHms) {
  const target = hmsToSeconds(targetHms);
  let diff = target - nowSeconds();
  if (diff < 0) diff += 86400;
  return diff;
}

function formatCountdown(diffSeconds) {
  const d = Math.max(0, diffSeconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;

  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
  } catch (e) {
  }
}

function applyPreset(preset) {
  state.preset = preset;

  if (preset === "hockey") {
    state.pauseLenSchema = "18:00";
    state.billboard = "00:30";
  }
  if (preset === "football") {
    state.pauseLenSchema = "15:00";
    state.billboard = "00:20";
  }
  if (preset === "bandy") {
    state.pauseLenSchema = "15:00";
    state.billboard = "00:30";
  }
  if (preset === "innebandy") {
    state.pauseLenSchema = "10:00";
    state.billboard = "00:20";
  }

  state.pauseLenActual = state.pauseLenSchema;
  renderAll();
  save();
}

function renderAll() {
  el("onAirTime").value = state.onAirTime;
  el("periodEnd").value = state.periodEnd;

  el("pauseLenSchema").value = state.pauseLenSchema;
  el("pauseLenActual").textContent = state.pauseLenActual;

  el("billboard").value = state.billboard;
  el("highlights").value = state.highlights;
  el("extraTalk").value = state.extraTalk;

  el("homeInterview").value = state.homeInterview;
  el("awayInterview").value = state.awayInterview;

  el("manualAfterPauseTime").value = state.manualAfterPauseTime;

  el("preset").value = state.preset;

  const totalInterviewSec = msToSeconds(state.homeInterview) + msToSeconds(state.awayInterview);
  el("interviewTotal").textContent = `Totalt intervjupaket: ${secondsToMS(totalInterviewSec)}`;

  el("calcResult").style.display = state.calcDone ? "block" : "none";
  el("manualAfterPausePanel").style.display = state.calcDone ? "block" : "none";
}

function calcTimes() {
  const periodEndSec = hmsToSeconds(state.periodEnd);
  const pauseSec = msToSeconds(state.pauseLenActual);

  const nextPeriodStartSec = periodEndSec + pauseSec;

  const pkgSec =
    msToSeconds(state.billboard) +
    msToSeconds(state.highlights) +
    msToSeconds(state.extraTalk) +
    (msToSeconds(state.homeInterview) + msToSeconds(state.awayInterview));

  const recommendedOnAirSec = nextPeriodStartSec - pkgSec;

  el("nextPeriodStart").textContent = secondsToHMS(nextPeriodStartSec);
  el("recommendedOnAir").textContent = secondsToHMS(recommendedOnAirSec);

  if (state.manualAfterPauseTime === "00:00:00") {
    state.manualAfterPauseTime = secondsToHMS(recommendedOnAirSec);
    el("manualAfterPauseTime").value = state.manualAfterPauseTime;
  }

  state.calcDone = true;
  renderAll();
  save();
}

function resetAll() {
  state.onAirTime = "00:00:00";
  state.periodEnd = "00:00:00";

  state.pauseLenSchema = "18:00";
  state.pauseLenActual = "18:00";

  state.billboard = "00:30";
  state.highlights = "00:00";
  state.extraTalk = "00:00";

  state.homeInterview = "00:00";
  state.awayInterview = "00:00";

  state.manualAfterPauseTime = "00:00:00";
  state.calcDone = false;
  state.preset = "none";

  renderAll();
  save();
}

function setLiveClock() {
  const n = new Date();
  el("liveClock").textContent = `${pad2(n.getHours())}:${pad2(n.getMinutes())}:${pad2(n.getSeconds())}`;
}

function tick() {
  setLiveClock();

  const diffOnAir = countdownTo(state.onAirTime);
  el("onAirCountdownText").textContent =
    `Nedräkning till sändningsstart: ${formatCountdown(diffOnAir)}`;

  const diffManual = countdownTo(state.manualAfterPauseTime);
  const countdownEl = el("manualAfterPauseCountdown");

  if (state.calcDone) {
    if (diffManual <= 0) {
      countdownEl.textContent = "Nu";
      countdownEl.classList.add("is-now");
    } else {
      countdownEl.textContent = formatCountdown(diffManual);
      countdownEl.classList.remove("is-now");
    }
  }
}

function openPicker(title, mode, targetId, currentValue) {
  pickerMode = mode;      // "hms" eller "ms"
  pickerTarget = targetId;

  el("pickerTitle").textContent = title;

  const wheels = el("pickerWheels");
  wheels.innerHTML = "";

  if (mode === "hms") {
    wheels.innerHTML = `
      <select id="pH"></select><span>:</span>
      <select id="pM"></select><span>:</span>
      <select id="pS"></select>
    `;
    const pH = el("pH"), pM = el("pM"), pS = el("pS");

    for (let i = 0; i < 24; i++) pH.add(new Option(pad2(i), i));
    for (let i = 0; i < 60; i++) {
      pM.add(new Option(pad2(i), i));
      pS.add(new Option(pad2(i), i));
    }

    const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(currentValue || "00:00:00");
    pH.value = String(Number(m ? m[1] : 0));
    pM.value = String(Number(m ? m[2] : 0));
    pS.value = String(Number(m ? m[3] : 0));
  }

  if (mode === "ms") {
    wheels.innerHTML = `
      <select id="pM"></select><span>:</span>
      <select id="pS"></select>
    `;
    const pM = el("pM"), pS = el("pS");

    for (let i = 0; i < 60; i++) pM.add(new Option(pad2(i), i));
    for (let i = 0; i < 60; i++) pS.add(new Option(pad2(i), i));

    const m = /^(\d{2}):(\d{2})$/.exec(currentValue || "00:00");
    pM.value = String(Number(m ? m[1] : 0));
    pS.value = String(Number(m ? m[2] : 0));
  }

  el("pickerOverlay").style.display = "flex";
}

function closePicker() {
  el("pickerOverlay").style.display = "none";
  pickerMode = null;
  pickerTarget = null;
}

function pickerOk() {
  if (!pickerTarget || !pickerMode) return;

  let value = "00:00";

  if (pickerMode === "hms") {
    value = `${pad2(Number(el("pH").value))}:${pad2(Number(el("pM").value))}:${pad2(Number(el("pS").value))}`;
  }

  if (pickerMode === "ms") {
    value = `${pad2(Number(el("pM").value))}:${pad2(Number(el("pS").value))}`;
  }

  if (pickerTarget === "onAirTime") state.onAirTime = value;
  if (pickerTarget === "periodEnd") state.periodEnd = value;
  if (pickerTarget === "manualAfterPauseTime") state.manualAfterPauseTime = value;

  if (pickerTarget === "pauseLenSchema") {
    state.pauseLenSchema = value;
    state.pauseLenActual = value;
  }

  if (pickerTarget === "billboard") state.billboard = value;
  if (pickerTarget === "highlights") state.highlights = value;
  if (pickerTarget === "extraTalk") state.extraTalk = value;
  if (pickerTarget === "homeInterview") state.homeInterview = value;
  if (pickerTarget === "awayInterview") state.awayInterview = value;

  renderAll();
  save();
  closePicker();
}

function init() {
  load();
  renderAll();

  el("preset").addEventListener("change", (e) => applyPreset(e.target.value));

  el("btnSetOnAir").onclick = () => openPicker("Sändningsstart", "hms", "onAirTime", state.onAirTime);
  el("btnNowPeriodEnd").onclick = () => {
    const d = new Date();
    state.periodEnd = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    renderAll();
    save();
  };

  el("btnSetPauseSchema").onclick = () => openPicker("Pauslängd (schema)", "ms", "pauseLenSchema", state.pauseLenSchema);

  el("btnSetBillboard").onclick = () => openPicker("Billboard + vinjett", "ms", "billboard", state.billboard);
  el("btnSetHighlights").onclick = () => openPicker("Höjdpunkter", "ms", "highlights", state.highlights);
  el("btnSetExtraTalk").onclick = () => openPicker("Extra prat", "ms", "extraTalk", state.extraTalk);

  el("btnSetHomeInterview").onclick = () => openPicker("Intervju hemmalag", "ms", "homeInterview", state.homeInterview);
  el("btnSetAwayInterview").onclick = () => openPicker("Intervju bortalag", "ms", "awayInterview", state.awayInterview);

  el("btnCalc").onclick = () => calcTimes();
  el("btnReset").onclick = () => resetAll();

  el("btnSetManualAfterPause").onclick = () =>
    openPicker("Manuell on air efter paus", "hms", "manualAfterPauseTime", state.manualAfterPauseTime);

  el("pickerCancel").onclick = () => closePicker();
  el("pickerOk").onclick = () => pickerOk();

  tick();
  setInterval(tick, 1000);
}

init();
