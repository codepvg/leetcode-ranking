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
  {
    id: "TOP_BRASS",
    title: "Currently ranked in the top 10 on the overall leaderboard",
  },
];

export async function loadBadges(data) {
  const badgeWall = document.getElementById("badge-wall");
  if (!badgeWall) return;

  badgeWall.innerHTML = "";

  try {
    const history = data.history || [];
    const ranks = data.leaderboardRanks || {};
    const earnedSet = new Set();

    if (data.streak && data.streak.current >= 7) {
      earnedSet.add("HOT_STREAK");
    }

    if (history.length >= 8) {
      const recent = history.slice(-8, -1);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const solvedHard = last.hard - first.hard;
      const solvedEasy = last.easy - first.easy;
      if (solvedHard >= 5 && solvedEasy === 0) {
        earnedSet.add("HARD_CARRY");
      }
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

    if (
      ranks.overall &&
      ranks.overall.rank !== undefined &&
      ranks.overall.rank !== "--"
    ) {
      const overallRank = parseInt(ranks.overall.rank, 10);
      if (!isNaN(overallRank) && overallRank <= 10) {
        earnedSet.add("TOP_BRASS");
      }
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

    ALL_BADGES.forEach((badgeDef) => {
      const isEarned = earnedSet.has(badgeDef.id);
      const badge = document.createElement("div");
      const safeClass = badgeDef.id.toLowerCase().replace(/_/g, "");

      // Apply locked class if the user hasn't earned it
      badge.className = isEarned
        ? `badge badge-${safeClass}`
        : `badge badge-${safeClass} badge-locked`;

      badge.textContent = `${badgeDef.id}`;
      badge.setAttribute("data-title", badgeDef.title);

      badgeWall.appendChild(badge);
    });
  } catch (err) {
    console.error("Error loading user badges:", err);
  }
}
