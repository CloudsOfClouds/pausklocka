let billboard = 18;
let interview = 0;

const billboardEl = document.getElementById("billboard");
const interviewEl = document.getElementById("interview");

function updateUI() {
  billboardEl.textContent = billboard;
  interviewEl.textContent = interview;
}

document.getElementById("setPreset").addEventListener("click", () => {
  billboard = 18;
  interview = 120;
  updateUI();
});

document.getElementById("save").addEventListener("click", () => {
  localStorage.setItem("billboard_duration", billboard);
  localStorage.setItem("interview_home", interview);
  localStorage.setItem("interview_away", 0);

  alert("Sparat!");
});

updateUI();
