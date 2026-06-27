async function fetchUserInfo(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!username || !usernameRegex.test(username)) {
    throw new Error("Invalid username format");
  }

  let history = [];
  let ranking = null;
  let badges = [];
  let contest = null;

  const liveApiUrl = `https://leetcode-api-dun.vercel.app/${username}`;
  const cacheBuster = Date.now();
  const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/user-data/${username}.json?t=${cacheBuster}`;

  let leaderboardRanks = {
    overall: { rank: "--", change: 0 },
    daily: { rank: "--", change: 0 },
    weekly: { rank: "--", change: 0 },
    monthly: { rank: "--", change: 0 },
  };

  // 1. Fetch historical data, ranks, and badges in a single network pass
  try {
    const response = await fetch(rawUrl);
    if (response.ok) {
      const data = await response.json();

      // Auto-Migration Check & Routing
      if (Array.isArray(data)) {
        history = data;
      } else {
        // Safe object destructuring for the new profile structure
        history = data.history || [];
        badges = data.badges || [];
        if (data.leaderboardRanks) {
          leaderboardRanks = data.leaderboardRanks;
        }
      }
    } else {
      console.warn(
        `No historical data found for user: ${username} (HTTP ${response.status})`,
      );
    }
  } catch (err) {
    console.error(
      `Failed to fetch historical data for ${username}:`,
      err.message,
    );
  }

  // 2. Fetch live profile ranking from the wrapper API
  const livePromise = fetch(liveApiUrl)
    .then(async (res) => {
      if (res.ok) {
        const apiData = await res.json();
        ranking = apiData.ranking || 0;
        contest = apiData.contest || null;
      } else {
        throw new Error(`LeetCode API wrapper returned status ${res.status}`);
      }
    });

  // Wait for the live API task to complete
  await livePromise;

  // Ensure history is sorted chronologically
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    username,
    ranking,
    leaderboardRanks,
    badges,
    contest,
    history,
  };
}

module.exports = fetchUserInfo;
