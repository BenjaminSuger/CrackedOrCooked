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
  queue = allCards.sort(() => Math.random() - 0.5);
}

function loadState() {
  const savedIndex = localStorage.getItem("currentIndex");
  if (savedIndex) currentIndex = parseInt(savedIndex);
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
      <div>${card.question}</div>
      ${card.image ? `<img src="${card.image}" />` : ""}
      <div class="answer" id="answer">${card.answer}</div>
    </div>
  `;
}

function showAnswer() {
  document.getElementById("answer").style.display = "block";
}

function markKnown(known) {
  const card = queue[currentIndex];

  progress[card.id] = known ? "known" : "unknown";

  currentIndex++;
  saveState();
  showCard();
}
