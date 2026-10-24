/* Soldiers Hill Volleyball Club — local-only version. No database required. */

const REGISTRATION_FEE = 50;
const COURT_AND_LIGHTS_FEE = 430;

const POSITIONS = [
  "Setter",
  "Open Spiker 1",
  "Open Spiker 2",
  "Middle Blocker 1",
  "Middle Blocker 2",
  "Utility Spiker",
  "Libero"
];

const STORAGE = {
  walkins: "shvc_walkin_players_v1",
  attendance: "shvc_game_attendance_v1",
  games: "shvc_games_v1",
  eligibility: "shvc_position_eligibility_v3"
};

/* Replace these sample names with your actual regular roster. */
const regularPlayers = [
  { id: "member-1", name: "Frank", type: "regular" },
  { id: "member-2", name: "Jirah", type: "regular" },
  { id: "member-3", name: "Duncan", type: "regular" },
  { id: "member-4", name: "Christian", type: "regular" },
  { id: "member-5", name: "Melchor", type: "regular" },
  { id: "member-6", name: "Shadie", type: "regular" },
  { id: "member-7", name: "Arian", type: "regular" },
  { id: "member-8", name: "Jason", type: "regular" },
  { id: "member-9", name: "Jonas", type: "regular" },
  { id: "member-10", name: "Carl", type: "regular" },
  { id: "member-11", name: "Valdez", type: "regular" },
  { id: "member-12", name: "Sebby", type: "regular" },
  { id: "member-13", name: "Jimbrix", type: "regular" },
  { id: "member-14", name: "Jamlag", type: "regular" },
  { id: "member-15", name: "Drei", type: "regular" },
  { id: "member-16", name: "Kenneth", type: "regular" },
  { id: "member-17", name: "Gesteve", type: "regular" },
  { id: "member-18", name: "Tristan", type: "regular" }
];

const defaultGames = [
  {
    id: "game-1",
    title: "Winner Takes All",
    date: "2026-10-25",
    time: "17:00",
    location: "Soldiers Hill, Zone 10, Bulua"
  }
];

let walkIns = loadJSON(STORAGE.walkins, []);
let games = loadJSON(STORAGE.games, defaultGames);
let attendance = loadJSON(STORAGE.attendance, {});
let eligibility = loadJSON(STORAGE.eligibility, {});
let rouletteResults = {};
let noticeTimer;

/* GENERAL HELPERS */

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showNotice(
      "This browser couldn't save local data. Check available storage space.",
      true
    );
  }
}

function allPlayers() {
  return [...regularPlayers, ...walkIns];
}

function getPlayer(id) {
  return allPlayers().find(player => player.id === id);
}

function getJoinedPlayers(gameId) {
  const ids = attendance[gameId] || [];
  return allPlayers().filter(player => ids.includes(player.id));
}

function money(value) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");

  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;

  clearTimeout(noticeTimer);

  noticeTimer = setTimeout(() => {
    notice.hidden = true;
  }, 4200);
}

/* NAVIGATION */

function setPage(page) {
  const allowed = ["home", "games", "members", "roulette"];

  if (!allowed.includes(page)) {
    page = "home";
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `page-${page}`
    );
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const titles = {
    home: "Home",
    games: "Games & Prize Pot",
    members: "Club Members",
    roulette: "Team Roulette"
  };

  document.getElementById("page-title").textContent = titles[page];

  if (page === "roulette") {
    renderRoulette();
  }

  if (page === "members") {
    renderMembers();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    setPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    setPage(button.dataset.go);
  });
});

document.querySelectorAll("[data-page-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    setPage(link.dataset.pageLink);
  });
});

/* HOME DASHBOARD */

function gameCardSummary(game) {
  const count = getJoinedPlayers(game.id).length;

  const date = new Date(
    `${game.date}T${game.time || "17:00"}:00`
  );

  const formattedDate = Number.isNaN(date.getTime())
    ? game.date
    : date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

  const formattedTime = game.time
    ? new Date(`2000-01-01T${game.time}:00`).toLocaleTimeString(
        "en-PH",
        {
          hour: "numeric",
          minute: "2-digit"
        }
      )
    : "Time TBA";

  return `
    <article class="game-card">
      <div class="game-header">
        <div>
          <h2>${escapeHTML(game.title)}</h2>
          <div class="game-details">
            <div>▦ ${escapeHTML(formattedDate)} · ${escapeHTML(formattedTime)}</div>
            <div>⌖ ${escapeHTML(game.location)}</div>
            <div>♙ ${count} player${count === 1 ? "" : "s"} checked in</div>
          </div>
        </div>
        <span class="registration-label">
          ${money(REGISTRATION_FEE)} per player
        </span>
      </div>
      <div class="form-actions">
        <button class="button button-primary" data-open-game="${escapeHTML(game.id)}">
          Manage attendance &amp; pot →
        </button>
      </div>
    </article>
  `;
}

function renderHome() {
  document.getElementById("home-games-count").textContent = games.length;
  document.getElementById("home-members-count").textContent = regularPlayers.length;
  document.getElementById("home-walkins-count").textContent = walkIns.length;

  const list = document.getElementById("home-games-list");

  list.innerHTML = games.length
    ? games.map(gameCardSummary).join("")
    : '<div class="empty-state">No games scheduled. Add one in Games &amp; Pot.</div>';
}

/* GAMES AND PRIZE POT */

function renderGames() {
  const list = document.getElementById("games-list");

  if (!games.length) {
    list.innerHTML =
      '<div class="empty-state">No games yet. Use “Add a game” to schedule one.</div>';
    return;
  }

  list.innerHTML = games.map(game => {
    const joined = getJoinedPlayers(game.id);
    const ids = attendance[game.id] || [];

    const collected = joined.length * REGISTRATION_FEE;
    const prize = collected - COURT_AND_LIGHTS_FEE;

    const checks = allPlayers().map(player => `
      <label class="player-check">
        <input
          type="checkbox"
          class="attendance-checkbox"
          data-game-id="${escapeHTML(game.id)}"
          data-player-id="${escapeHTML(player.id)}"
          ${ids.includes(player.id) ? "checked" : ""}
        >
        <span class="player-name">${escapeHTML(player.name)}</span>
        ${player.type === "walkin" ? '<span class="joined-tag">Walk-in</span>' : ""}
        ${ids.includes(player.id) ? '<span class="joined-tag">Joining</span>' : ""}
      </label>
    `).join("");

    return `
      <article class="game-card" id="game-card-${escapeHTML(game.id)}">
        <div class="game-header">
          <div>
            <h2>${escapeHTML(game.title)}</h2>
            <div class="game-details">
              <div>▦ ${escapeHTML(game.date)} · ${escapeHTML(game.time || "Time TBA")}</div>
              <div>⌖ ${escapeHTML(game.location)}</div>
            </div>
          </div>
          <span class="registration-label">
            ${money(REGISTRATION_FEE)} per player
          </span>
        </div>

        <div class="game-layout">
          <div class="player-checklist">
            <h3>Who's joining? (${joined.length})</h3>

            <div class="checklist-tools">
              <button class="small-btn select-all-btn" data-game-id="${escapeHTML(game.id)}">
                Select all
              </button>
              <button class="small-btn clear-all-btn" data-game-id="${escapeHTML(game.id)}">
                Clear all
              </button>
            </div>

            <div class="player-list">
              ${checks || '<p class="muted small-text">Add players in Club Members first.</p>'}
            </div>
          </div>

          <div class="pot-panel">
            <h3>Prize pot calculator</h3>

            <div class="pot-row">
              <span>Players checked in</span>
              <strong>${joined.length}</strong>
            </div>

            <div class="pot-row">
              <span>Fee per player</span>
              <strong>${money(REGISTRATION_FEE)}</strong>
            </div>

            <div class="pot-row">
              <span>Total registration</span>
              <strong>${money(collected)}</strong>
            </div>

            <div class="pot-row">
              <span>Court &amp; lights fee</span>
              <strong>−${money(COURT_AND_LIGHTS_FEE)}</strong>
            </div>

            <div class="pot-row total">
              <span>Winner's pot</span>
              <strong class="${prize < 0 ? "pot-negative" : ""}">
                ${money(prize)}
              </strong>
            </div>

            <p class="pot-note">
              Estimated pot = fees collected minus the fixed court and lighting cost.
            </p>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

document.getElementById("games-list").addEventListener("change", event => {
  const checkbox = event.target.closest(".attendance-checkbox");

  if (!checkbox) return;

  const gameId = checkbox.dataset.gameId;
  const playerId = checkbox.dataset.playerId;

  if (!attendance[gameId]) {
    attendance[gameId] = [];
  }

  if (
    checkbox.checked &&
    !attendance[gameId].includes(playerId)
  ) {
    attendance[gameId].push(playerId);
  }

  if (!checkbox.checked) {
    attendance[gameId] = attendance[gameId].filter(
      id => id !== playerId
    );
  }

  save(STORAGE.attendance, attendance);

  renderGames();
  renderHome();
  renderRoulette();
});

document.getElementById("games-list").addEventListener("click", event => {
  const selectAll = event.target.closest(".select-all-btn");
  const clearAll = event.target.closest(".clear-all-btn");
  const openGame = event.target.closest("[data-open-game]");

  if (openGame) {
    setPage("games");

    document.getElementById(
      `game-card-${CSS.escape(openGame.dataset.openGame)}`
    )?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  if (!selectAll && !clearAll) return;

  const gameId = (selectAll || clearAll).dataset.gameId;

  attendance[gameId] = selectAll
    ? allPlayers().map(player => player.id)
    : [];

  save(STORAGE.attendance, attendance);

  renderGames();
  renderHome();
  renderRoulette();
});

document.getElementById("home-games-list").addEventListener("click", event => {
  const button = event.target.closest("[data-open-game]");

  if (!button) return;

  setPage("games");

  setTimeout(() => {
    document.getElementById(
      `game-card-${CSS.escape(button.dataset.openGame)}`
    )?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 30);
});

/* ADD A GAME */

document.getElementById("toggle-game-form").addEventListener("click", () => {
  const form = document.getElementById("game-form");
  form.hidden = !form.hidden;
});

document.getElementById("cancel-game-form").addEventListener("click", () => {
  document.getElementById("game-form").reset();
  document.getElementById("game-form").hidden = true;
});

document.getElementById("game-form").addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(event.currentTarget);

  const title = String(data.get("title") || "").trim();
  const location = String(data.get("location") || "").trim();
  const date = String(data.get("date") || "");
  const time = String(data.get("time") || "");

  if (!title || !location || !date || !time) return;

  const game = {
    id: `game-${Date.now()}`,
    title,
    location,
    date,
    time
  };

  games.push(game);

  save(STORAGE.games, games);

  event.currentTarget.reset();
  event.currentTarget.hidden = true;

  renderGames();
  renderHome();
  renderRoulette();

  showNotice("Game added and saved in this browser.");
});

/* CLUB MEMBERS AND WALK-INS */

function renderMemberCard(player, isWalkIn) {
  return `
    <article class="member-card">
      <div class="member-top">
        <div class="member-avatar">
          ${escapeHTML(player.name.charAt(0).toUpperCase())}
        </div>
        <div>
          <h3>${escapeHTML(player.name)}</h3>
          <p>${isWalkIn ? "Temporary walk-in" : "Regular club member"}</p>
        </div>
      </div>

      ${
        isWalkIn
          ? `<button class="button button-secondary remove-walkin" data-remove-walkin="${escapeHTML(player.id)}">
               Remove walk-in
             </button>`
          : ""
      }
    </article>
  `;
}

function renderMembers() {
  document.getElementById("regular-count").textContent = regularPlayers.length;
  document.getElementById("walkin-count").textContent = walkIns.length;

  document.getElementById("regular-members-list").innerHTML =
    regularPlayers.map(player => renderMemberCard(player, false)).join("");

  document.getElementById("walkin-members-list").innerHTML =
    walkIns.length
      ? walkIns.map(player => renderMemberCard(player, true)).join("")
      : '<div class="empty-state">No walk-in players added yet.</div>';
}

document.getElementById("walkin-form").addEventListener("submit", event => {
  event.preventDefault();

  const input = document.getElementById("walkin-name");
  const name = input.value.trim();

  if (!name) return;

  const duplicate = allPlayers().some(
    player => player.name.toLocaleLowerCase() === name.toLocaleLowerCase()
  );

  if (duplicate) {
    showNotice(
      "That name is already in the roster. Check the list before adding it again.",
      true
    );
    return;
  }

  const player = {
    id: `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    type: "walkin"
  };

  walkIns.push(player);

  save(STORAGE.walkins, walkIns);

  input.value = "";

  renderMembers();
  renderGames();
  renderHome();
  renderRoulette();

  showNotice(`${name} added as a walk-in player.`);
});

document.getElementById("walkin-members-list").addEventListener("click", event => {
  const button = event.target.closest("[data-remove-walkin]");

  if (!button) return;

  const player = walkIns.find(
    item => item.id === button.dataset.removeWalkin
  );

  if (!player) return;

  if (
    !confirm(
      `Remove ${player.name} from the walk-in list and all game attendance lists?`
    )
  ) {
    return;
  }

  walkIns = walkIns.filter(item => item.id !== player.id);

  Object.keys(attendance).forEach(gameId => {
    attendance[gameId] = (attendance[gameId] || []).filter(
      id => id !== player.id
    );
  });

  Object.keys(eligibility).forEach(gameId => {
    Object.keys(eligibility[gameId] || {}).forEach(position => {
      eligibility[gameId][position] =
        eligibility[gameId][position].filter(id => id !== player.id);
    });
  });

  save(STORAGE.walkins, walkIns);
  save(STORAGE.attendance, attendance);
  save(STORAGE.eligibility, eligibility);

  renderMembers();
  renderGames();
  renderHome();
  renderRoulette();

  showNotice(`${player.name} removed.`);
});

/* TEAM ROULETTE */

const rouletteGameSelect = document.getElementById("roulette-game");

function renderGameOptions() {
  const oldValue = rouletteGameSelect.value;

  rouletteGameSelect.innerHTML = games.map(game => `
    <option value="${escapeHTML(game.id)}">
      ${escapeHTML(game.title)} — ${escapeHTML(game.date)}
    </option>
  `).join("");

  if (games.some(game => game.id === oldValue)) {
    rouletteGameSelect.value = oldValue;
  } else if (games.length) {
    rouletteGameSelect.value = games[0].id;
  }
}

function selectedGameId() {
  return rouletteGameSelect.value;
}

function getEligibleIds(gameId, position) {
  const joinedIds = (attendance[gameId] || []).filter(
    id => Boolean(getPlayer(id))
  );

  // New eligibility settings start empty for every position.
  if (
    !eligibility[gameId] ||
    !Array.isArray(eligibility[gameId][position])
  ) {
    return [];
  }

  return eligibility[gameId][position].filter(
    id => joinedIds.includes(id)
  );
}

function renderEligibility() {
  const container = document.getElementById("position-eligibility-list");
  const gameId = selectedGameId();
  const joined = gameId ? getJoinedPlayers(gameId) : [];

  document.getElementById("roulette-eligible").textContent =
    `${joined.length} player${joined.length === 1 ? "" : "s"} checked in for this game.`;

  if (!gameId) {
    container.innerHTML = '<div class="empty-state">Add a game first.</div>';
    return;
  }

  if (!joined.length) {
    container.innerHTML =
      '<div class="empty-state">No players checked in. Go to Games &amp; Pot and check in the players for this match.</div>';
    return;
  }

  container.innerHTML = POSITIONS.map(position => {
    const chosenIds = getEligibleIds(gameId, position);

    const checks = joined.map(player => `
      <label class="eligibility-check">
        <input
          type="checkbox"
          data-eligibility-position="${escapeHTML(position)}"
          data-player-id="${escapeHTML(player.id)}"
          ${chosenIds.includes(player.id) ? "checked" : ""}
        >
        <span>${escapeHTML(player.name)}</span>
        ${player.type === "walkin" ? '<span class="joined-tag">Walk-in</span>' : ""}
      </label>
    `).join("");

    return `
      <div class="position-eligibility-card">
        <h4>
          ${escapeHTML(position)}
          <span class="muted">(${chosenIds.length})</span>
        </h4>
        <div class="eligibility-players">${checks}</div>
      </div>
    `;
  }).join("");
}

function renderDraws() {
  const gameId = selectedGameId();
  const container = document.getElementById("roulette-grid");

  const results =
    gameId && rouletteResults[gameId]
      ? rouletteResults[gameId]
      : {};

  container.innerHTML = POSITIONS.map(position => {
    const result = results[position];

    const usedByOtherPosition = Object.entries(results)
      .filter(([slot, assigned]) => slot !== position && assigned)
      .map(([, assigned]) => assigned.id);

    const availableCount = getEligibleIds(gameId, position)
      .filter(id => !usedByOtherPosition.includes(id)).length;

    return `
      <article class="roulette-item">
        <h3>${escapeHTML(position)}</h3>

        <div class="roulette-result" id="result-${slug(position)}">
          ${result ? escapeHTML(result.name) : "—"}
        </div>

        <p class="roulette-available">
          ${result ? "Picked" : `${availableCount} available player${availableCount === 1 ? "" : "s"}`}
        </p>

        <button
          class="button button-secondary draw-btn"
          data-draw-position="${escapeHTML(position)}"
        >
          ${result ? "Redraw position" : "Draw player"}
        </button>
      </article>
    `;
  }).join("");
}

function shuffle(values) {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/*
  Builds a full lineup by finding a valid assignment for all seven positions.
  A player can be eligible for multiple positions but can only be assigned once.
*/
function makeFullLineup(gameId) {
  const pools = POSITIONS.map(position => ({
    position,
    ids: shuffle(getEligibleIds(gameId, position))
  })).sort((a, b) => a.ids.length - b.ids.length);

  const assignment = {};
  const used = new Set();

  function assign(index) {
    if (index === pools.length) {
      return true;
    }

    const { position, ids } = pools[index];

    for (const id of ids) {
      if (used.has(id)) continue;

      used.add(id);
      assignment[position] = id;

      if (assign(index + 1)) {
        return true;
      }

      used.delete(id);
      delete assignment[position];
    }

    return false;
  }

  return assign(0) ? assignment : null;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderRoulette() {
  renderGameOptions();
  renderEligibility();
  renderDraws();
}

rouletteGameSelect.addEventListener("change", () => {
  renderEligibility();
  renderDraws();
});

/* SAVE INDIVIDUAL POSITION ELIGIBILITY */

document.getElementById("position-eligibility-list").addEventListener("change", event => {
  const checkbox = event.target.closest("[data-eligibility-position]");

  if (!checkbox) return;

  const gameId = selectedGameId();
  const position = checkbox.dataset.eligibilityPosition;
  const playerId = checkbox.dataset.playerId;

  if (!eligibility[gameId]) {
    eligibility[gameId] = {};
  }

  if (!Array.isArray(eligibility[gameId][position])) {
    eligibility[gameId][position] = [];
  }

  if (
    checkbox.checked &&
    !eligibility[gameId][position].includes(playerId)
  ) {
    eligibility[gameId][position].push(playerId);
  }

  if (!checkbox.checked) {
    eligibility[gameId][position] =
      eligibility[gameId][position].filter(id => id !== playerId);
  }

  save(STORAGE.eligibility, eligibility);

  const heading = checkbox
    .closest(".position-eligibility-card")
    ?.querySelector("h4");

  if (heading) {
    heading.innerHTML = `
      ${escapeHTML(position)}
      <span class="muted">(${getEligibleIds(gameId, position).length})</span>
    `;
  }
});

/* SELECT EVERYONE FOR EVERY POSITION */

document.getElementById("select-all-eligible").addEventListener("click", () => {
  const gameId = selectedGameId();

  if (!gameId) return;

  const ids = getJoinedPlayers(gameId).map(player => player.id);

  if (!eligibility[gameId]) {
    eligibility[gameId] = {};
  }

  POSITIONS.forEach(position => {
    eligibility[gameId][position] = [...ids];
  });

  save(STORAGE.eligibility, eligibility);
  renderEligibility();

  showNotice("All checked-in players are eligible for every position in this match.");
});

/* CLEAR ALL POSITION ELIGIBILITY */

document.getElementById("reset-eligibility").addEventListener("click", () => {
  const gameId = selectedGameId();

  if (!gameId) return;

  if (!eligibility[gameId]) {
    eligibility[gameId] = {};
  }

  POSITIONS.forEach(position => {
    eligibility[gameId][position] = [];
  });

  save(STORAGE.eligibility, eligibility);

  renderEligibility();

  showNotice("Cleared all positions. Select only the players eligible for each position.");
});

/* DRAW ONE POSITION */

document.getElementById("roulette-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-draw-position]");

  if (!button) return;

  const gameId = selectedGameId();
  const position = button.dataset.drawPosition;

  if (!gameId) {
    showNotice("Add a game first.", true);
    return;
  }

  const eligibleIds = getEligibleIds(gameId, position);

  if (!eligibleIds.length) {
    showNotice(
      `No eligible players for ${position}. Select players above first.`,
      true
    );
    return;
  }

  if (!rouletteResults[gameId]) {
    rouletteResults[gameId] = {};
  }

  const usedByOtherPositions = Object.entries(rouletteResults[gameId])
    .filter(([slot, result]) => slot !== position && result)
    .map(([, result]) => result.id);

  const available = eligibleIds.filter(
    id => !usedByOtherPositions.includes(id)
  );

  if (!available.length) {
    showNotice(
      "No eligible players left for this position without repeating someone. Reset a draw or adjust eligibility.",
      true
    );
    return;
  }

  const chosenId = available[
    Math.floor(Math.random() * available.length)
  ];

  const chosen = getPlayer(chosenId);

  rouletteResults[gameId][position] = {
    id: chosen.id,
    name: chosen.name
  };

  renderDraws();
});

/* DRAW ALL SEVEN POSITIONS IN ONE ROUND */

document.getElementById("draw-full-team").addEventListener("click", () => {
  const gameId = selectedGameId();

  if (!gameId) {
    showNotice("Add a game first.", true);
    return;
  }

  const lineup = makeFullLineup(gameId);

  if (!lineup) {
    showNotice(
      "A complete team cannot be formed with the current eligibility settings. Check that at least seven distinct players can fill all positions.",
      true
    );
    return;
  }

  rouletteResults[gameId] = {};

  POSITIONS.forEach(position => {
    const player = getPlayer(lineup[position]);

    rouletteResults[gameId][position] = {
      id: player.id,
      name: player.name
    };
  });

  renderDraws();

  showNotice("Full team drawn! Each player appears in only one position.");
});

/* RESET DRAW RESULTS */

document.getElementById("reset-roulette").addEventListener("click", () => {
  const gameId = selectedGameId();

  if (gameId) {
    delete rouletteResults[gameId];
  }

  renderDraws();

  showNotice("All position draws reset for this match.");
});

/* INITIALIZE WEBSITE */

function initialize() {
  // Remove invalid player IDs from attendance without discarding valid data.
  const validIds = new Set(allPlayers().map(player => player.id));

  Object.keys(attendance).forEach(gameId => {
    attendance[gameId] = (attendance[gameId] || []).filter(
      id => validIds.has(id)
    );
  });

  renderHome();
  renderGames();
  renderMembers();
  renderRoulette();
}

initialize();
