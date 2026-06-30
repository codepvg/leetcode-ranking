async function loadBadges(username) {
  const badgeWall = document.getElementById("badge-wall");
  if (!badgeWall) return;

  badgeWall.innerHTML = "";

  try {
    const res = await fetch(`/api/user/${username}`);
    if (!res.ok) throw new Error("API response error");

    const data = await res.json();
    const earnedBadges = data.badges || [];

    if (earnedBadges.length === 0) {
      return;
    }

    earnedBadges.forEach((type) => {
      const badge = document.createElement("div");

      badge.className = `badge badge-${type.toLowerCase().replace("_", "")}`;
      badge.textContent = `[${type}]`;

      if (type === "HOT_STREAK")
        badge.setAttribute(
          "data-title",
          "Solved >= 1 problem every day for 7 days",
        );
      if (type === "SPEEDRUN")
        badge.setAttribute(
          "data-title",
          "Top 3 problem-solving velocity this week",
        );
      if (type === "UP_LINK")
        badge.setAttribute("data-title", "Jumped 5+ positions in ranks");

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
