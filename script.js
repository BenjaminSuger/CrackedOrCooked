let allCards = [];
let filteredCards = [];
let queue = [];
let currentIndex = 0;
let progress = JSON.parse(localStorage.getItem("progress")) || {};

let selectedDecks = new Set();

init();

async function init() {
  try {
    const decks = await fetch("data/index.json").then(r => r.json());

    console.log("DECKS LOADED:", decks);

    renderSidebar(decks);

    const results = await Promise.all(
      decks.map(async (d) => {
        const cards = await fetch("data/" + d.file).then(r => r.json());

        return cards.map(c => ({
          ...c,
          source: d.file.split("/").pop() // 🔥 NORMALISATION CRITIQUE
        }));
      })
    );

    allCards = results.flat();

    console.log("ALL CARDS:", allCards);

    // par défaut : tout sélectionné
    decks.forEach(d => selectedDecks.add(d.file));

    filterAndStart();

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
}

function renderSidebar(decks) {
  const sidebar = document.getElementById("sidebar");

  sidebar.innerHTML = "<h3>Catégories</h3>";

  decks.forEach(deck => {
    const id = "deck_" + deck.file;

    const label = document.createElement("label");

    label.innerHTML = `
      <input type="checkbox" id="${id}" checked>
      ${deck.name}
    `;

    const checkbox = label.querySelector("input");

    checkbox.onchange = () => {
      toggleDeck(deck.file);
    };

    sidebar.appendChild(label);
  });
}

function toggleDeck(file) {
  if (selectedDecks.has(file)) {
    selectedDecks.delete(file);
  } else {
    selectedDecks.add(file);
  }

  console.log("SELECTED DECKS:", [...selectedDecks]);

  filterAndStart();
}

function filterAndStart() {
  filteredCards = allCards.filter(c =>
    selectedDecks.has(c.source)
  );

  console.log("FILTERED CARDS:", filteredCards);

  if (filteredCards.length === 0) {
    document.getElementById("card-container").innerHTML =
      "<p style='color:red'>⚠️ Aucune carte dans les decks sélectionnés</p>";
    return;
  }

  setupQueue();
  currentIndex = 0;
  showCard();
}

function setupQueue() {
  queue = [...filteredCards].sort(() => Math.random() - 0.5);
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
  if (answer) answer.style.display = "block";

  document.querySelectorAll(".answer-img")
    .forEach(img => img.style.display = "block");
}

function markKnown(known) {
  const card = queue[currentIndex];

  progress[card.id] = known ? "known" : "unknown";

  currentIndex++;

  saveState();
  showCard();
}

function saveState() {
  localStorage.setItem("currentIndex", currentIndex);
  localStorage.setItem("progress", JSON.stringify(progress));
}

function resetProgress() {
  const confirmReset = confirm("Reset progression ?");
  if (!confirmReset) return;

  localStorage.removeItem("currentIndex");
  localStorage.removeItem("progress");

  currentIndex = 0;
  progress = {};

  filterAndStart();
}
