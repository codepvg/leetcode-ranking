document.addEventListener("click", (e) => {
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const scoreEl = e.target.closest(".mobile-score");

  if (scoreEl) {
    e.preventDefault();

    if (scoreEl.classList.contains("active")) {
      scoreEl.classList.remove("active");
    } else {
      document
        .querySelectorAll(".mobile-score.active")
        .forEach((el) => el.classList.remove("active"));

      scoreEl.classList.add("active");
    }
    return;
  }

  document
    .querySelectorAll(".mobile-score.active")
    .forEach((el) => el.classList.remove("active"));
});

function createRankChangeElement(rankChange) {
  if (!rankChange) return null;
  if (rankChange === "=") {
    return null;
  }
  var span = document.createElement("span");
  span.className = "rank-change";
  if (rankChange === "NEW") {
    span.classList.add("rank-neutral");
    span.textContent = "[new]";
    span.setAttribute("data-tooltip", "Newly added to the leaderboard");
  } else if (rankChange.startsWith("+")) {
    span.classList.add("rank-up");
    span.textContent = "[" + rankChange + "]";
    var placesUp = rankChange.replace("+", "");
    span.setAttribute(
      "data-tooltip",
      "Rank increased by " + placesUp + " places today",
    );
  } else {
    span.classList.add("rank-down");
    span.textContent = "[" + rankChange + "]";
    var placesDown = rankChange.replace("-", "");
    span.setAttribute(
      "data-tooltip",
      "Rank dropped by " + placesDown + " places today",
    );
  }

  return span;
}

// Creates a rank tag DOM element (safe — values are hardcoded)
function createRankTagElement(rank) {
  var className, label;
  switch (rank) {
    case 1:
      className = "privilege-tag root-tag";
      label = "[ROOT]";
      break;
    case 2:
      className = "privilege-tag sudo-tag";
      label = "[SUDO]";
      break;
    case 3:
      className = "privilege-tag exec-tag";
      label = "[EXEC]";
      break;
    default:
      return null;
  }
  var span = document.createElement("span");
  span.className = className;
  span.textContent = label;
  return span;
}

// Helper: create external link SVG icon (hardcoded — safe)
function createExternalIcon() {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.classList.add("external-icon");
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M14 3H21V10M21 3L10 14M21 14V21H3V3H10");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

function renderLeaderboardRow(user, rank) {
  const rankTagEl = createRankTagElement(rank);
  const rankChangeEl =
    user.score > 0 ? createRankChangeElement(user.rankChange) : null;
  const easyPoints = 1;
  const mediumPoints = 3;
  const hardPoints = 5;

  const easyScore = user.data.easySolved * easyPoints;
  const mediumScore = user.data.mediumSolved * mediumPoints;
  const hardScore = user.data.hardSolved * hardPoints;

  const row = document.createElement("tr");
  row.className = "leaderboard-row";

  // Compare checkbox column
  const checkboxCell = document.createElement("td");
  checkboxCell.className = "compare-checkbox-cell";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "compare-checkbox";
  checkbox.dataset.username = user.id;
  if (
    window.selectedUsers &&
    window.selectedUsers.some((u) => u.id === user.id)
  ) {
    checkbox.checked = true;
  }
  checkbox.addEventListener("change", (e) => {
    if (typeof window.handleUserSelection === "function") {
      window.handleUserSelection(user, e.target.checked);
    }
  });
  checkboxCell.appendChild(checkbox);
  row.appendChild(checkboxCell);

  // Rank (numeric — safe)
  const rankCell = document.createElement("td");
  rankCell.className = "rank";
  if (rank === "") {
    rankCell.textContent = "[IDLE]";
    rankCell.style.color = "var(--text-dim)";
    rankCell.style.fontSize = "0.75rem";
  } else if (rank === "--") {
    rankCell.textContent = "[--]";
    rankCell.style.color = "var(--text-dim)";
  } else {
    rankCell.textContent = rank;
  }
  row.appendChild(rankCell);

  // Name cell — tag is safe DOM element, name is user-controlled (textContent)
  const nameCell = document.createElement("td");
  nameCell.className = "name-cell";
  const nameInner = document.createElement("span");
  nameInner.className = "name-cell-inner";
  if (rankTagEl) {
    nameInner.appendChild(rankTagEl);
  }
  const nameTextWrapper = document.createElement("span");
  nameTextWrapper.className = "name-text";
  nameTextWrapper.appendChild(document.createTextNode(user.name));

  if (rankChangeEl) {
    nameTextWrapper.appendChild(document.createTextNode(" "));
    nameTextWrapper.appendChild(rankChangeEl);
  }

  nameInner.appendChild(nameTextWrapper);
  nameCell.appendChild(nameInner);
  row.appendChild(nameCell);

  // Username with link and external icon — id is user-controlled (textContent)
  const usernameCell = document.createElement("td");
  usernameCell.className = "username";
  const link = document.createElement("a");
  link.href = `https://leetcode.com/u/${user.id}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "user-link";
  link.textContent = user.id;
  link.appendChild(createExternalIcon());
  usernameCell.appendChild(link);
  row.appendChild(usernameCell);

  // Easy (numeric — safe)
  const easyCell = document.createElement("td");
  easyCell.className = "easy";
  easyCell.textContent = user.data.easySolved;
  row.appendChild(easyCell);

  // Medium (numeric — safe)
  const mediumCell = document.createElement("td");
  mediumCell.className = "medium";
  mediumCell.textContent = user.data.mediumSolved;
  row.appendChild(mediumCell);

  // Hard (numeric — safe)
  const hardCell = document.createElement("td");
  hardCell.className = "hard";
  hardCell.textContent = user.data.hardSolved;
  row.appendChild(hardCell);

  // Total (numeric — safe)
  const totalCell = document.createElement("td");
  totalCell.className = "total";
  totalCell.textContent = user.data.totalSolved;
  row.appendChild(totalCell);

  // Score with tooltip — all content is numeric or hardcoded labels
  const scoreCell = document.createElement("td");
  scoreCell.className = "score-cell";
  const scoreInner = document.createElement("div");
  scoreInner.className = "mobile-score tooltip-score";

  const scoreSpan = document.createElement("span");
  scoreSpan.textContent = user.score;
  scoreInner.appendChild(scoreSpan);

  const caretSpan = document.createElement("span");
  caretSpan.className = "score-caret";
  scoreInner.appendChild(caretSpan);

  scoreInner.appendChild(
    buildScoreTooltip(
      user,
      easyPoints,
      mediumPoints,
      hardPoints,
      easyScore,
      mediumScore,
      hardScore,
    ),
  );
  scoreCell.appendChild(scoreInner);
  row.appendChild(scoreCell);
  return row;
}

function renderMobileCard(user, rank) {
  const easyPoints = 1;
  const mediumPoints = 3;
  const hardPoints = 5;

  const easyScore = user.data.easySolved * easyPoints;
  const mediumScore = user.data.mediumSolved * mediumPoints;
  const hardScore = user.data.hardSolved * hardPoints;

  const card = document.createElement("div");
  card.className = "mobile-card";

  // Card header
  const cardHeader = document.createElement("div");
  cardHeader.className = "mobile-card-header";

  // Compare checkbox column for mobile
  const checkboxCell = document.createElement("div");
  checkboxCell.className = "compare-checkbox-cell";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "compare-checkbox";
  checkbox.dataset.username = user.id;
  if (
    window.selectedUsers &&
    window.selectedUsers.some((u) => u.id === user.id)
  ) {
    checkbox.checked = true;
  }
  checkbox.addEventListener("change", (e) => {
    if (typeof window.handleUserSelection === "function") {
      window.handleUserSelection(user, e.target.checked);
    }
  });
  checkboxCell.appendChild(checkbox);
  cardHeader.appendChild(checkboxCell);

  const mobileRank = document.createElement("div");
  mobileRank.className = "mobile-rank";
  if (rank === "") {
    mobileRank.textContent = "[IDLE]";
    mobileRank.style.color = "var(--text-dim)";
    mobileRank.style.fontSize = "0.75rem";
  } else if (rank === "--") {
    mobileRank.textContent = "[--]";
    mobileRank.style.color = "var(--text-dim)";
  } else {
    mobileRank.textContent = `#${rank}`;
  }
  cardHeader.appendChild(mobileRank);

  const mobileScore = document.createElement("div");
  mobileScore.className = "mobile-score tooltip-score";

  const mobileScoreSpan = document.createElement("span");
  mobileScoreSpan.textContent = user.score;
  mobileScore.appendChild(mobileScoreSpan);

  const mobileCaretSpan = document.createElement("span");
  mobileCaretSpan.className = "score-caret";
  mobileScore.appendChild(mobileCaretSpan);

  mobileScore.appendChild(
    buildScoreTooltip(
      user,
      easyPoints,
      mediumPoints,
      hardPoints,
      easyScore,
      mediumScore,
      hardScore,
    ),
  );
  cardHeader.appendChild(mobileScore);

  card.appendChild(cardHeader);

  // Name — tag safe DOM element, name is user-controlled (textContent)
  const mobileName = document.createElement("div");
  mobileName.className = "mobile-name";
  const mobileRankTagEl = createRankTagElement(rank);
  const mobileRankChangeEl =
    user.score > 0 ? createRankChangeElement(user.rankChange) : null;
  if (mobileRankTagEl) {
    mobileName.appendChild(mobileRankTagEl);
  }
  mobileName.appendChild(document.createTextNode(user.name));
  if (mobileRankChangeEl) {
    mobileName.appendChild(mobileRankChangeEl);
  }
  card.appendChild(mobileName);

  // Username — id is user-controlled (textContent)
  const mobileUsername = document.createElement("div");
  mobileUsername.className = "mobile-username";
  const mobileLink = document.createElement("a");
  mobileLink.href = `https://leetcode.com/u/${user.id}`;
  mobileLink.target = "_blank";
  mobileLink.rel = "noopener noreferrer";
  mobileLink.className = "user-link";
  mobileLink.textContent = user.id;
  mobileLink.appendChild(createExternalIcon());
  mobileUsername.appendChild(mobileLink);
  card.appendChild(mobileUsername);

  // Stats
  const mobileStats = document.createElement("div");
  mobileStats.className = "mobile-stats";

  const makeStat = (value, statClass, label) => {
    const stat = document.createElement("div");
    stat.className = "mobile-stat";
    const num = document.createElement("div");
    num.className = `mobile-stat-number ${statClass}`;
    num.textContent = value;
    stat.appendChild(num);
    const lbl = document.createElement("div");
    lbl.className = "mobile-stat-label";
    lbl.textContent = label;
    stat.appendChild(lbl);
    return stat;
  };

  mobileStats.appendChild(makeStat(user.data.easySolved, "easy", "Easy"));
  mobileStats.appendChild(makeStat(user.data.mediumSolved, "medium", "Medium"));
  mobileStats.appendChild(makeStat(user.data.hardSolved, "hard", "Hard"));
  mobileStats.appendChild(makeStat(user.data.totalSolved, "total", "Total"));

  card.appendChild(mobileStats);

  return card;
}
