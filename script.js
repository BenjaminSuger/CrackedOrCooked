let allCards = [];
let filteredCards = [];
let queue = [];
let currentIndex = 0;

// Progression persistante (localStorage), cle = "deck:id" (ex: "python:001")
let progress = loadProgress();

// "new" : cartes jamais repondues | "cooked" : rejouer les cartes ratees
let mode = "new";

let selectedDecks = new Set();

init();

function loadProgress() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("progress")) || {};
  } catch (e) {
    saved = {};
  }

  // Ancien format (cle = id seul) : ignore, il n'etait pas unique entre decks
  const cleaned = {};
  Object.keys(saved).forEach(k => {
    if (k.includes(":")) cleaned[k] = saved[k];
  });

  // Ancienne cle de position, plus utilisee
  localStorage.removeItem("currentIndex");

  return cleaned;
}

function cardKey(card) {
  return card.source.replace(/\.json$/, "") + ":" + card.id;
}

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
    document.getElementById("progress").textContent = "";
    document.getElementById("card-container").innerHTML =
      "<p style='color:red'>⚠️ Aucune carte dans les decks sélectionnés</p>";
    updateStats();
    return;
  }

  setupQueue();
  currentIndex = 0;
  showCard();
  updateStats();
}

function setupQueue() {
  let pool;

  if (mode === "cooked") {
    pool = filteredCards.filter(c => progress[cardKey(c)] === "unknown");
  } else {
    pool = filteredCards.filter(c => !(cardKey(c) in progress));
  }

  queue = [...pool].sort(() => Math.random() - 0.5);
}

function showCard() {
  const card = queue[currentIndex];

  if (!card) {
    showFinished();
    return;
  }

  document.getElementById("progress").textContent =
    `${currentIndex + 1} / ${queue.length}`;

  document.getElementById("card-container").innerHTML = `
    <div class="card">
      <div class="question">
        ${card.question}
      </div>

      ${card.questionImage ? `<img src="${card.questionImage}" class="question-img" />` : ""}

      <div class="answer" id="answer">
        ${card.answer.replace(/\n/g, "<br>")}
      </div>

      ${card.answerImage ? `<img src="${card.answerImage}" class="answer-img" />` : ""}
    </div>
  `;
}

function showFinished() {
  const cookedCount = filteredCards.filter(
    c => progress[cardKey(c)] === "unknown"
  ).length;

  document.getElementById("progress").textContent =
    queue.length ? `${queue.length} / ${queue.length}` : "";

  let html = "<p>🎉 Terminé !</p>";

  if (cookedCount > 0) {
    html += `
      <p>${cookedCount} carte(s) cooked sur les decks sélectionnés.</p>
      <button onclick="replayCooked()">☠️ Rejouer les cooked (${cookedCount})</button>
    `;
  } else {
    html += "<p>🔥 Tout est cracked sur les decks sélectionnés.</p>";
  }

  document.getElementById("card-container").innerHTML = html;
}

function replayCooked() {
  mode = "cooked";
  setupQueue();
  currentIndex = 0;
  showCard();
}

function showAnswer() {
  const answer = document.getElementById("answer");
  if (answer) answer.style.display = "block";

  document.querySelectorAll(".answer-img")
  .forEach(img => img.classList.add("visible"));
}

function markKnown(known) {
  const card = queue[currentIndex];
  if (!card) return;

  progress[cardKey(card)] = known ? "known" : "unknown";

  currentIndex++;

  saveState();
  showCard();
  updateStats();
}

// Compteurs calcules depuis la progression sauvegardee, sur les decks coches
function updateStats() {
  const stats = document.getElementById("stats");

  let cracked = 0;
  let cooked = 0;

  filteredCards.forEach(c => {
    const state = progress[cardKey(c)];
    if (state === "known") cracked++;
    else if (state === "unknown") cooked++;
  });

  const total = cracked + cooked;
  const remaining = filteredCards.length - total;

  const crackedPct = total ? Math.round((cracked / total) * 100) : 0;
  const cookedPct = total ? Math.round((cooked / total) * 100) : 0;

  stats.textContent =
    `🔥 Cracked: ${cracked} (${crackedPct}%) | ☠️ Cooked: ${cooked} (${cookedPct}%) | 📚 Restantes: ${remaining}`;
}

function saveState() {
  localStorage.setItem("progress", JSON.stringify(progress));
}

function resetProgress() {
  const confirmReset = confirm("Reset progression ?");
  if (!confirmReset) return;

  localStorage.removeItem("progress");

  progress = {};
  mode = "new";

  filterAndStart();
}

document.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("question-img") ||
    e.target.classList.contains("answer-img")
  ) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");

    modalImg.src = e.target.src;

    modal.classList.remove("hidden");
  }
  if (e.target.id === "image-modal") {
    document.getElementById("image-modal")
      .classList.add("hidden");
  }
});
