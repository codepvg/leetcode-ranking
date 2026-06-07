// Helper: build score breakdown tooltip (all content is numeric or hardcoded — safe)
function buildScoreTooltip(
  user,
  easyPts,
  medPts,
  hardPts,
  eScore,
  mScore,
  hScore,
) {
  var tooltip = document.createElement("div");
  tooltip.className = "score-tooltip";

  var easyLine = document.createElement("div");
  easyLine.textContent =
    "Easy: " + user.data.easySolved + " \u00D7 " + easyPts + " = " + eScore;
  tooltip.appendChild(easyLine);

  var medLine = document.createElement("div");
  medLine.textContent =
    "Medium: " + user.data.mediumSolved + " \u00D7 " + medPts + " = " + mScore;
  tooltip.appendChild(medLine);

  var hardLine = document.createElement("div");
  hardLine.textContent =
    "Hard: " + user.data.hardSolved + " \u00D7 " + hardPts + " = " + hScore;
  tooltip.appendChild(hardLine);

  var totalSolvedLine = document.createElement("div");
  totalSolvedLine.textContent = "Questions Solved: " + user.data.totalSolved;
  tooltip.appendChild(totalSolvedLine);

  var hr = document.createElement("hr");
  tooltip.appendChild(hr);

  var totalLine = document.createElement("div");
  var strong = document.createElement("strong");
  strong.textContent = "Total: " + user.score;
  totalLine.appendChild(strong);
  tooltip.appendChild(totalLine);

  return tooltip;
}
