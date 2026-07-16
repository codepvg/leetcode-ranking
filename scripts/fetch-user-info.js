/**
 * Wraps `fetch()` with an AbortController-based timeout so the request
 * cleanly aborts if the remote API does not respond within the given window.
 *
 * @param {string} url - The URL to fetch
 * @param {number} [timeoutMs=15000] - Timeout in milliseconds
 * @returns {Promise<Response>} The fetch Response (same shape as native fetch)
 */
async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchUserInfo(username) {
  let liveSolved = null;
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
    const response = await fetchWithTimeout(rawUrl);
    if (response.ok) {
      const data = await response.json();

      // Auto-Migration Check & Routing
      if (Array.isArray(data)) {
        history = data;
      } else if (data && typeof data === "object") {
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
  const livePromise = fetchWithTimeout(liveApiUrl).then(async (res) => {
    if (res.ok) {
      const apiData = await res.json();
      ranking = apiData.ranking || 0;
      contest = apiData.contest || null;
    } else {
      throw new Error(`LeetCode API wrapper returned status ${res.status}`);
    }
  });

  ranking = apiData.ranking || 0;
  contest = apiData.contest || null;

  // Ensure history is sorted chronologically
  // Guard against a corrupted history file (e.g. non-array `history` field)
  history = Array.isArray(history) ? history : [];
  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date().toISOString().split("T")[0];
  let latestEntry = null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];

    if (
      typeof entry.date === "string" &&
      entry.date.startsWith(today)
    ) {
      latestEntry = entry;
      break;
    }
  }

  if (latestEntry && liveSolved) {
    latestEntry.easy = liveSolved.easy;
    latestEntry.medium = liveSolved.medium;
    latestEntry.hard = liveSolved.hard;
  }

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
