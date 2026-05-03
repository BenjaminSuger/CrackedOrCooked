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
    <div class="card" onclick="flipCard(this)">
      <div class="card-inner">
        
        <div class="card-front">
          <div>${card.question}</div>
          ${card.questionImage ? `<img src="${card.questionImage}" />` : ""}
        </div>

        <div class="card-back">
          <div>${card.answer}</div>
          ${card.answerImage ? `<img src="${card.answerImage}" />` : ""}
        </div>

      </div>
    </div>
  `;
}

function flipCard(el) {
  el.classList.toggle("flipped");
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
