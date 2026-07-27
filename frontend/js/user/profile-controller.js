import { loadBadges } from "./badges.js";
import { loadContestProfile } from "./contest.js";
import { loadGoalSetter } from "./goal-setter.js";
import { fetchUserData } from "./historical-graphs.js";
import { loadLeaderboardRanks } from "./ranks.js";

function getUsername() {
  const pathSegments = window.location.pathname.split("/");
  return (
    pathSegments[pathSegments.length - 1] ||
    pathSegments[pathSegments.length - 2] ||
    ""
  );
}

async function initProfile() {
  const username = getUsername();
  if (!username) return;

  // Set header display variables prior to fetch if elements exist
  const usernameHeading = document.getElementById("username-display");
  if (usernameHeading) {
    usernameHeading.innerText = `Performance Profile: @${username}`;
  }

  const pageTitle = document.getElementById("page-title");
  if (pageTitle) {
    pageTitle.textContent = `${username} — CodePVG`;
  }

  try {
    const res = await fetch(`/api/user/${username}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    // Distribute the single payload across all rendering modules simultaneously
    loadBadges(data);
    loadContestProfile(data);
    loadGoalSetter(username, data);
    fetchUserData(username, data);
    loadLeaderboardRanks(data);
  } catch (error) {
    console.error("Critical error loading profile package:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfile);
} else {
  initProfile();
}
