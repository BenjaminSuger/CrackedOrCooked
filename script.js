let allCards = [];
let queue = [];
let currentIndex = 0;
let progress = JSON.parse(localStorage.getItem("progress")) || {};

init();

async function init() {
  const files = await fetch("data/index.json").then(r => r.json());

  const results = await Promise.all(
    files.map(f => fetch("data/" + f).then(r => r.json()))
  );

  allCards = results.flat();

  setupQueue();
  loadState();
  showCard();
}

function setupQueue() {
  queue = [...allCards].sort(() => Math.random() - 0.5);
}

function loadState() {
  const savedIndex = localStorage.getItem("currentIndex");
  if (savedIndex !== null) {
    currentIndex = parseInt(savedIndex);
  }
}

function saveState() {
  localStorage.setItem("currentIndex", currentIndex);
  localStorage.setItem("progress", JSON.stringify(progress));
}

function showCard() {
  const card = queue[currentIndex];

  if (!card) {
    document.getElementById("card-container").innerHTML =
      "<p>🎉 Terminé !</p>";
    return;
  }

  document.getElementById("progress").textContent =
    `${currentIndex + 1} / ${queue.length}`;

  document.getElementById("card-container").innerHTML = `
    <div class="card">
      <div class="question">
        ${card.question}
      </div>

      ${card.questionImage ? `<img src="${card.questionImage}" />` : ""}

      <div class="answer" id="answer">
        ${card.answer.replace(/\n/g, "<br>")}
      </div>

      ${card.answerImage ? `<img src="${card.answerImage}" class="answer-img" />` : ""}
    </div>
  `;
}

function showAnswer() {
  const answer = document.getElementById("answer");
  if (answer) {
    answer.style.display = "block";
  }

  const img = document.querySelector(".answer-img");
  if (img) {
    img.style.display = "block";
  }
}

function markKnown(known) {
  const card = queue[currentIndex];

  progress[card.id] = known ? "known" : "unknown";

  currentIndex++;
  saveState();
  showCard();
}

function resetProgress() {
  const confirmReset = confirm("Reset progression ?");
  if (!confirmReset) return;

  localStorage.removeItem("currentIndex");
  localStorage.removeItem("progress");

  currentIndex = 0;
  progress = {};
  setupQueue();
  showCard();
}
