async function loadContestProfile(username) {
  const contestSection = document.getElementById("contest-section");
  if (!contestSection) return;

  try {
    const res = await fetch(`/api/user/${username}`);
    if (!res.ok) throw new Error("API response error");

    const data = await res.json();

    // Check if contest data exists and the user has actually participated
    if (data.contest && data.contest.attendedContestsCount > 0) {
      contestSection.style.display = "block";

      // Render metrics
      document.getElementById("contest-rating").textContent = Math.round(
        data.contest.rating,
      );

      const globalRank = data.contest.globalRanking.toLocaleString();
      const totalParts = data.contest.totalParticipants.toLocaleString();
      document.getElementById("contest-global-rank").textContent =
        `${globalRank} / ${totalParts}`;

      document.getElementById("contest-top-percentage").textContent =
        `${data.contest.topPercentage}%`;
      document.getElementById("contest-attended").textContent =
        `${data.contest.attendedContestsCount} CONTESTS`;

      // Render LeetCode Badge (e.g., Knight, Guardian) if they have one
      if (data.contest.badge) {
        const badgeWrapper = document.getElementById("contest-badge-wrapper");
        if (badgeWrapper) {
          const badgeClass = `badge-${data.contest.badge.toLowerCase()}`;
          badgeWrapper.innerHTML = `<span class="badge ${badgeClass}">[${data.contest.badge.toUpperCase()}]</span>`;
        }
      }
    } else {
      // Hide the block gracefully if no contest history exists
      contestSection.style.display = "none";
    }
  } catch (err) {
    console.error("Error loading contest profile:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pathSegments = window.location.pathname.split("/");
  const username =
    pathSegments[pathSegments.length - 1] ||
    pathSegments[pathSegments.length - 2];

  if (username) {
    loadContestProfile(username);
  }
});
