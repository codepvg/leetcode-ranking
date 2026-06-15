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

// Creates a rank change DOM element (safe — values are internally generated)
function createRankChangeElement(rankChange) {
  if (!rankChange) return null;
  var span = document.createElement("span");
  span.className = "rank-change";
  if (rankChange === "NEW") {
    span.classList.add("rank-neutral");
    span.textContent = "[new]";
  } else if (rankChange === "=") {
    span.classList.add("rank-neutral");
    span.textContent = "[==]";
  } else if (rankChange.startsWith("+")) {
    span.classList.add("rank-up");
    span.textContent = "[" + rankChange + "]";
  } else {
    span.classList.add("rank-down");
    span.textContent = "[" + rankChange + "]";
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
  const rankChangeEl = createRankChangeElement(user.rankChange);
  const easyPoints = 1;
  const mediumPoints = 3;
  const hardPoints = 5;

  const easyScore = user.data.easySolved * easyPoints;
  const mediumScore = user.data.mediumSolved * mediumPoints;
  const hardScore = user.data.hardSolved * hardPoints;

  const row = document.createElement("div");
  row.className = "leaderboard-row";
  row.setAttribute("role", "row");

  // Rank (numeric — safe)
  const rankDiv = document.createElement("div");
  rankDiv.className = "rank";
  rankDiv.textContent = rank;
  rankDiv.setAttribute("role", "cell");
  row.appendChild(rankDiv);

  // Name cell — tag is safe DOM element, name is user-controlled (textContent)
  const nameDiv = document.createElement("div");
  nameDiv.className = "name-cell";
  nameDiv.setAttribute("role", "cell");
  if (rankTagEl) {
    nameDiv.appendChild(rankTagEl);
  }
  const nameTextWrapper = document.createElement("span");
  nameTextWrapper.className = "name-text";
  nameTextWrapper.appendChild(document.createTextNode(user.name));

  if (rankChangeEl) {
    nameTextWrapper.appendChild(document.createTextNode(" "));
    nameTextWrapper.appendChild(rankChangeEl);
  }

  nameDiv.appendChild(nameTextWrapper);
  row.appendChild(nameDiv);

  // Username with link and external icon — id is user-controlled (textContent)
  const usernameDiv = document.createElement("div");
  usernameDiv.className = "username";
  usernameDiv.setAttribute("role", "cell");
  const link = document.createElement("a");
  link.href = `https://leetcode.com/u/${user.id}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "user-link";
  link.textContent = user.id;
  link.appendChild(createExternalIcon());
  usernameDiv.appendChild(link);
  row.appendChild(usernameDiv);

  // Easy (numeric — safe)
  const easyDiv = document.createElement("div");
  easyDiv.className = "easy";
  easyDiv.textContent = user.data.easySolved;
  easyDiv.setAttribute("role", "cell");
  row.appendChild(easyDiv);

  // Medium (numeric — safe)
  const mediumDiv = document.createElement("div");
  mediumDiv.className = "medium";
  mediumDiv.textContent = user.data.mediumSolved;
  mediumDiv.setAttribute("role", "cell");
  row.appendChild(mediumDiv);

  // Hard (numeric — safe)
  const hardDiv = document.createElement("div");
  hardDiv.className = "hard";
  hardDiv.textContent = user.data.hardSolved;
  hardDiv.setAttribute("role", "cell");
  row.appendChild(hardDiv);

  // Total (numeric — safe)
  const totalDiv = document.createElement("div");
  totalDiv.className = "total";
  totalDiv.textContent = user.data.totalSolved;
  totalDiv.setAttribute("role", "cell");
  row.appendChild(totalDiv);

  // Score with tooltip — all content is numeric or hardcoded labels
  const scoreDiv = document.createElement("div");
  scoreDiv.className = "mobile-score tooltip-score";
  scoreDiv.setAttribute("role", "cell");

  const scoreSpan = document.createElement("span");
  scoreSpan.textContent = user.score;
  scoreDiv.appendChild(scoreSpan);

  const caretSpan = document.createElement("span");
  caretSpan.className = "score-caret";
  scoreDiv.appendChild(caretSpan);

  scoreDiv.appendChild(
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
  row.appendChild(scoreDiv);
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

  const mobileRank = document.createElement("div");
  mobileRank.className = "mobile-rank";
  mobileRank.textContent = `#${rank}`;
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
  const mobileRankChangeEl = createRankChangeElement(user.rankChange);
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
  mobileStats.appendChild(
    makeStat(user.data.mediumSolved, "medium", "Medium"),
  );
  mobileStats.appendChild(makeStat(user.data.hardSolved, "hard", "Hard"));
  mobileStats.appendChild(makeStat(user.data.totalSolved, "total", "Total"));

  card.appendChild(mobileStats);

  return card;
}