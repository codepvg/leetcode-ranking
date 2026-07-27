export function loadLeaderboardRanks(username) {
  const periods = ["overall", "monthly", "weekly", "daily"];
  try {
    const ranks = data.leaderboardRanks;
    if (!ranks) return;

    periods.forEach((period) => {
      const rankEl = document.getElementById(`${period}-rank`);
      const changeEl = document.getElementById(`${period}-change`);
      const itemContainer = document.getElementById(`${period}-item`);

      const rankData = ranks[period];

      // Clean fallback if rank is not present, is '--', or has a 0 rank score
      if (
        !rankData ||
        rankData.rank === "--" ||
        rankData.rank === 0 ||
        rankData.rank === null
      ) {
        if (rankEl) rankEl.textContent = "--";
        if (changeEl) changeEl.textContent = "";
        if (itemContainer) itemContainer.classList.add("placeholder-rank");
        return;
      }

      if (itemContainer) itemContainer.classList.remove("placeholder-rank");
      if (rankEl) rankEl.textContent = Number(rankData.rank);

      if (changeEl) {
        const change = rankData.change || 0;
        if (change > 0) {
          changeEl.textContent = `[+${change}]`;
          changeEl.className = "rank-change change-up";
          changeEl.setAttribute("data-title", `Moved up ${change} ranks today`);
        } else if (change < 0) {
          changeEl.textContent = `[${change}]`;
          changeEl.className = "rank-change change-down";
          changeEl.setAttribute(
            "data-title",
            `Fell ${Math.abs(change)} ranks today`,
          );
        } else {
          changeEl.textContent = ""; // Hide if 0
          changeEl.removeAttribute("data-title");
        }
      }
    });
  } catch (err) {
    console.error("Error loading leaderboard ranks:", err);
    periods.forEach((period) => {
      const el = document.getElementById(`${period}-rank`);
      if (el) el.textContent = "--";
    });
  }
}
