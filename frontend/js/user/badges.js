const ALL_BADGES = [
  { id: "HOT_STREAK", title: "Solved >= 1 problem every day for 7 days" },
  { id: "SPEEDRUN", title: "Top 3 problem-solving velocity this week" },
  { id: "UP_LINK", title: "Jumped 5+ positions in overall ranks today" },
  {
    id: "HARD_CARRY",
    title: "Solved 5+ Hard problems and 0 Easy problems over the past 7 days",
  },
  {
    id: "CENTURION",
    title: "Solved a grand total of 100 or more problems",
  },
];

async function loadBadges(username) {
  const badgeWall = document.getElementById("badge-wall");
  if (!badgeWall) return;

  badgeWall.innerHTML = "";

  try {
    const res = await fetch(`/api/user/${username}`);
    if (!res.ok) throw new Error("API response error");

    const data = await res.json();
    const history = data.history || [];
    const ranks = data.leaderboardRanks || {};

    const earnedSet = new Set();

    if (history.length >= 8) {
      const recent = history.slice(-8);
      let streak = true;
      for (let j = 1; j < recent.length; j++) {
        const todayTotals = recent[j].easy + recent[j].medium + recent[j].hard;
        const yesterdayTotals =
          recent[j - 1].easy + recent[j - 1].medium + recent[j - 1].hard;
        if (todayTotals - yesterdayTotals < 1) {
          streak = false;
          break;
        }
      }
      if (streak) earnedSet.add("HOT_STREAK");
    }

    if (history.length >= 1) {
      const latest = history[history.length - 1];
      const totalSolved =
        (latest.easy || 0) + (latest.medium || 0) + (latest.hard || 0);
      if (totalSolved >= 100) {
        earnedSet.add("CENTURION");
      }
    }

    if (ranks.overall && parseInt(ranks.overall.change, 10) >= 5) {
      earnedSet.add("UP_LINK");
    }

    if (ranks.weekly && ranks.weekly.rank !== "--" && ranks.weekly.rank <= 3) {
      if (history.length >= 2) {
        const recent = history.slice(-8);
        const first = recent[0];
        const last = recent[recent.length - 1];
        const weeklyScore =
          last.easy -
          first.easy +
          (last.medium - first.medium) * 3 +
          (last.hard - first.hard) * 5;
        if (weeklyScore > 0) earnedSet.add("SPEEDRUN");
      }
    }

    if (earnedSet.size === 0) return;

    earnedSet.forEach((badgeId) => {
      const badge = document.createElement("div");

      const badgeDef = ALL_BADGES.find((b) => b.id === badgeId);
      const safeClass = badgeId.toLowerCase().replace("_", "");

      badge.className = `badge badge-${safeClass}`;
      badge.textContent = `[${badgeId}]`;
      if (badgeDef) {
        badge.setAttribute("data-title", badgeDef.title);
      }

      badgeWall.appendChild(badge);
    });
  } catch (err) {
    console.error("Error loading user badges:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pathSegments = window.location.pathname.split("/");
  const username =
    pathSegments[pathSegments.length - 1] ||
    pathSegments[pathSegments.length - 2];

  if (username) {
    loadBadges(username);
  }
});
