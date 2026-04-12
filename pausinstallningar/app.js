const STORAGE_KEYS = {
  pauseDuration: "pause_duration",
  billboardDuration: "billboard_duration",
  highlightsDuration: "highlights_duration",
  interviewHome: "interview_home",
  interviewAway: "interview_away",
  countdownDuration: "countdown_duration",
  selectedPreset: "selected_preset"
};

const PRESETS = {
  bandy: {
    label: "Bandy",
    pauseDuration: 18 * 60,
    billboardDuration: 18
  },
  innebandy: {
    label: "Innebandy",
    pauseDuration: 15 * 60,
    billboardDuration: 18
  },
  ishockey: {
    label: "Ishockey",
    pauseDuration: 18 * 60,
    billboardDuration: 18
  },
  fotboll: {
    label: "Fotboll",
    pauseDuration: 15 * 60,
    billboardDuration: 18
  },
  custom: {
    label: "Custom"
  }
};

const state = {
  pauseDuration: 18 * 60,
  billboardDuration: 18,
  highlightsDuration: 0,
  interviewHome: 0,
  interviewAway: 0,
  countdownDuration: 5 * 60,
  selectedPreset: "ishockey",
  countdownRemaining: 5 * 60,
  billboardRemaining: 18,
  phase: "idle",
  timerId: null
};

let activeField = null;

const liveClockEl = document.getElementById("liveClock");
const countdownLabelEl = document.getElementById("countdownLabel");
const countdownDisplayEl = document.getElementById("countdownDisplay");
const countdownMetaEl = document.getElementById("countdownMeta");

const openCountdownPickerBtn = document.getElementById("openCountdownPicker");
const openPresetPickerBtn = document.getElementById("openPresetPicker");
const openPausePickerBtn = document.getElementById("openPausePicker");
const openBillboardPickerBtn = document.getElementById("openBillboardPicker");
const openHighlightsPickerBtn = document.getElementById("openHighlightsPicker");
const openInterviewHomePickerBtn = document.getElementById("openInterviewHomePicker");
const openInterviewAwayPickerBtn = document.getElementById("openInterviewAwayPicker");

const startCountdownBtn = document.getElementById("startCountdownBtn");
const pauseCountdownBtn = document.getElementById("pauseCountdownBtn");
const resetCountdownBtn = document.getElementById("resetCountdownBtn");

const billboardHighlightsTotalEl = document.getElementById("billboardHighlightsTotal");
const interviewTotalEl = document.getElementById("interviewTotal");

const overlay = document.getElementById("timePickerOverlay");
const titleEl = document.getElementById("timePickerTitle");
const pickerMinutes = document.getElementById("pickerMinutes");
const pickerSeconds = document.getElementById("pickerSeconds");
const pickerCancel = document.getElementById("pickerCancel");
const pickerSet = document.getElementById("pickerSet");

const presetOverlay = document.getElementById("presetPickerOverlay");
const presetCancel = document.getElementById("presetCancel");

function getStoredNumber(key, fallback) {
  const raw = localStorage.getItem(key);

  if (raw === null) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.pauseDuration, String(state.pauseDuration));
  localStorage.setItem(STORAGE_KEYS.billboardDuration, String(state.billboardDuration));
  localStorage.setItem(STORAGE_KEYS.highlightsDuration, String(state.highlightsDuration));
  localStorage.setItem(STORAGE_KEYS.interviewHome, String(state.interviewHome));
  localStorage.setItem(STORAGE_KEYS.interviewAway, String(state.interviewAway));
  localStorage.setItem(STORAGE_KEYS.countdownDuration, String(state.countdownDuration));
  localStorage.setItem(STORAGE_KEYS.selectedPreset, state.selectedPreset);
}

function loadState() {
  state.pauseDuration = getStoredNumber(STORAGE_KEYS.pauseDuration, 18 * 60);
  state.billboardDuration = getStoredNumber(STORAGE_KEYS.billboardDuration, 18);
  state.highlightsDuration = getStoredNumber(STORAGE_KEYS.highlightsDuration, 0);
  state.interviewHome = getStoredNumber(STORAGE_KEYS.interviewHome, 0);
  state.interviewAway = getStoredNumber(STORAGE_KEYS.interviewAway, 0);
  state.countdownDuration = getStoredNumber(STORAGE_KEYS.countdownDuration, 5 * 60);

  const storedPreset = localStorage.getItem(STORAGE_KEYS.selectedPreset);
  state.selectedPreset = storedPreset || "ishockey";

  state.countdownRemaining = state.countdownDuration;
  state.billboardRemaining = state.billboardDuration;
}

function populateSelects() {
  for (let i = 0; i <= 120; i += 1) {
    const label = String(i).padStart(2, "0");
    pickerMinutes.add(new Option(label, String(i)));
  }

  for (let i = 0; i < 60; i += 1) {
    const label = String(i).padStart(2, "0");
    pickerSeconds.add(new Option(label, String(i)));
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatMinutesSeconds(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${pad(seconds)}`;
}

function renderLiveClock() {
  liveClockEl.textContent = formatClock(new Date());
}

function getCountdownDisplayValue() {
  if (state.phase === "billboard") {
    return formatMinutesSeconds(state.billboardRemaining);
  }

  if (state.phase === "onair") {
    return "I sändning";
  }

  return formatMinutesSeconds(state.countdownRemaining);
}

function renderCountdown() {
  if (state.phase === "idle") {
    countdownLabelEl.textContent = "Countdown";
    countdownDisplayEl.textContent = getCountdownDisplayValue();
    countdownDisplayEl.classList.remove("warning");
    countdownMetaEl.textContent = "Redo att starta";
    return;
  }

  if (state.phase === "countdown") {
    countdownLabelEl.textContent = "Countdown";
    countdownDisplayEl.textContent = getCountdownDisplayValue();
    countdownDisplayEl.classList.toggle("warning", state.countdownRemaining <= 30);
    countdownMetaEl.textContent = "Nedräkning pågår";
    return;
  }

  if (state.phase === "paused-countdown") {
    countdownLabelEl.textContent = "Countdown";
    countdownDisplayEl.textContent = getCountdownDisplayValue();
    countdownDisplayEl.classList.remove("warning");
    countdownMetaEl.textContent = "Countdown pausad";
    return;
  }

  if (state.phase === "billboard") {
    countdownLabelEl.textContent = "Billboard";
    countdownDisplayEl.textContent = getCountdownDisplayValue();
    countdownDisplayEl.classList.add("warning");
    countdownMetaEl.textContent = "Billboard pågår";
    return;
  }

  if (state.phase === "paused-billboard") {
    countdownLabelEl.textContent = "Billboard";
    countdownDisplayEl.textContent = formatMinutesSeconds(state.billboardRemaining);
    countdownDisplayEl.classList.add("warning");
    countdownMetaEl.textContent = "Billboard pausad";
    return;
  }

  if (state.phase === "onair") {
    countdownLabelEl.textContent = "Status";
    countdownDisplayEl.textContent = "I sändning";
    countdownDisplayEl.classList.add("warning");
    countdownMetaEl.textContent = "Billboard avslutad";
  }
}

function renderButtons() {
  openCountdownPickerBtn.textContent = formatMinutesSeconds(state.countdownDuration);

  const presetLabel = PRESETS[state.selectedPreset]?.label || "Välj sport";
  openPresetPickerBtn.textContent = presetLabel;

  openPausePickerBtn.textContent = formatMinutesSeconds(state.pauseDuration);
  openBillboardPickerBtn.textContent = formatMinutesSeconds(state.billboardDuration);
  openHighlightsPickerBtn.textContent = formatMinutesSeconds(state.highlightsDuration);
  openInterviewHomePickerBtn.textContent = formatMinutesSeconds(state.interviewHome);
  openInterviewAwayPickerBtn.textContent = formatMinutesSeconds(state.interviewAway);
}

function renderTotals() {
  billboardHighlightsTotalEl.textContent = formatMinutesSeconds(
    state.billboardDuration + state.highlightsDuration
  );

  interviewTotalEl.textContent = formatMinutesSeconds(
    state.interviewHome + state.interviewAway
  );
}

function render() {
  renderLiveClock();
  renderCountdown();
  renderButtons();
  renderTotals();
}

function openTimePicker(field, title, valueInSeconds) {
  activeField = field;
  titleEl.textContent = title;
  pickerMinutes.value = String(Math.floor(valueInSeconds / 60));
  pickerSeconds.value = String(valueInSeconds % 60);

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeTimePicker() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  activeField = null;
}

function openPresetPicker() {
  presetOverlay.classList.remove("hidden");
  presetOverlay.setAttribute("aria-hidden", "false");
}

function closePresetPicker() {
  presetOverlay.classList.add("hidden");
  presetOverlay.setAttribute("aria-hidden", "true");
}

function markCustomForManualChanges() {
  if (state.selectedPreset !== "custom") {
    state.selectedPreset = "custom";
  }
}

function applyPreset(presetKey) {
  state.selectedPreset = presetKey;

  if (presetKey !== "custom") {
    state.pauseDuration = PRESETS[presetKey].pauseDuration;
    state.billboardDuration = PRESETS[presetKey].billboardDuration;
    state.billboardRemaining = state.billboardDuration;
  }

  saveState();
  render();
  closePresetPicker();
}

function applyPickedTime() {
  const totalSeconds =
    Number(pickerMinutes.value) * 60 + Number(pickerSeconds.value);

  if (activeField === "countdown") {
    state.countdownDuration = totalSeconds;
    state.countdownRemaining = totalSeconds;
  }

  if (activeField === "pause") {
    state.pauseDuration = totalSeconds;
    markCustomForManualChanges();
  }

  if (activeField === "billboard") {
    state.billboardDuration = totalSeconds;
    state.billboardRemaining = totalSeconds;
    markCustomForManualChanges();
  }

  if (activeField === "highlights") {
    state.highlightsDuration = totalSeconds;
  }

  if (activeField === "interviewHome") {
    state.interviewHome = totalSeconds;
  }

  if (activeField === "interviewAway") {
    state.interviewAway = totalSeconds;
  }

  saveState();
  render();
  closeTimePicker();
}

function clearTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function tickRunningPhase() {
  if (state.phase === "countdown") {
    if (state.countdownRemaining > 0) {
      state.countdownRemaining -= 1;
      render();
      return;
    }

    state.phase = "billboard";
    state.billboardRemaining = state.billboardDuration;
    render();
    return;
  }

  if (state.phase === "billboard") {
    if (state.billboardRemaining > 0) {
      state.billboardRemaining -= 1;
      render();
      return;
    }

    state.phase = "onair";
    clearTimer();
    render();
  }
}

function startFlow() {
  if (state.phase === "onair") {
    state.countdownRemaining = state.countdownDuration;
    state.billboardRemaining = state.billboardDuration;
    state.phase = "idle";
  }

  if (state.phase === "idle" || state.phase === "paused-countdown") {
    state.phase = "countdown";
  } else if (state.phase === "paused-billboard") {
    state.phase = "billboard";
  } else {
    return;
  }

  clearTimer();
  state.timerId = setInterval(tickRunningPhase, 1000);
  render();
}

function pauseFlow() {
  if (state.phase === "countdown") {
    state.phase = "paused-countdown";
  } else if (state.phase === "billboard") {
    state.phase = "paused-billboard";
  } else {
    return;
  }

  clearTimer();
  render();
}

function resetFlow() {
  clearTimer();
  state.phase = "idle";
  state.countdownRemaining = state.countdownDuration;
  state.billboardRemaining = state.billboardDuration;
  render();
}

function bindEvents() {
  openCountdownPickerBtn.addEventListener("click", () => {
    openTimePicker("countdown", "Countdown", state.countdownDuration);
  });

  openPausePickerBtn.addEventListener("click", () => {
    openTimePicker("pause", "Pauslängd", state.pauseDuration);
  });

  openBillboardPickerBtn.addEventListener("click", () => {
    openTimePicker("billboard", "Billboard", state.billboardDuration);
  });

  openHighlightsPickerBtn.addEventListener("click", () => {
    openTimePicker("highlights", "Highlights", state.highlightsDuration);
  });

  openInterviewHomePickerBtn.addEventListener("click", () => {
    openTimePicker("interviewHome", "Intervju hemma", state.interviewHome);
  });

  openInterviewAwayPickerBtn.addEventListener("click", () => {
    openTimePicker("interviewAway", "Intervju borta", state.interviewAway);
  });

  openPresetPickerBtn.addEventListener("click", openPresetPicker);

  pickerCancel.addEventListener("click", closeTimePicker);
  pickerSet.addEventListener("click", applyPickedTime);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeTimePicker();
    }
  });

  presetCancel.addEventListener("click", closePresetPicker);

  presetOverlay.addEventListener("click", (event) => {
    if (event.target === presetOverlay) {
      closePresetPicker();
    }
  });

  document.querySelectorAll(".preset-option").forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  startCountdownBtn.addEventListener("click", startFlow);
  pauseCountdownBtn.addEventListener("click", pauseFlow);
  resetCountdownBtn.addEventListener("click", resetFlow);
}

function init() {
  populateSelects();
  loadState();
  bindEvents();
  render();

  setInterval(() => {
    renderLiveClock();
  }, 1000);
}

init();
