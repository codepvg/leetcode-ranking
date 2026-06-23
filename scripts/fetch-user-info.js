async function fetchUserInfo(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!username || !usernameRegex.test(username)) {
    throw new Error("Invalid username format");
  }

  let history = [];
  let ranking = null;
  let badges = [];

  const liveApiUrl = `https://leetcode-api-dun.vercel.app/${username}`;
  const cacheBuster = Date.now();
  const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/user-data/${username}.json?t=${cacheBuster}`;
  const badgesUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/badges.json?t=${cacheBuster}`;

  const livePromise = fetch(liveApiUrl)
    .then(async (res) => {
      if (res.ok) {
        const apiData = await res.json();
        ranking = apiData.ranking || 0;
      }
    })
    .catch((err) =>
      console.error(
        "Failed to fetch live profile ranking from API wrapper:",
        err.message,
      ),
    );

  const historyPromise = fetch(rawUrl)
    .then(async (res) => {
      if (res.ok) {
        history = await res.json();
      } else {
        console.warn(
          `No historical data found for user: ${username} (HTTP ${res.status})`,
        );
      }
    })
    .catch((err) =>
      console.error(
        `Failed to fetch historical data for ${username}:`,
        err.message,
      ),
    );

  const badgesPromise = fetch(badgesUrl)
    .then(async (res) => {
      if (res.ok) {
        const badgesMap = await res.json();
        badges = badgesMap[username] || [];
      } else {
        console.warn(
          `Could not retrieve badges.json from GitHub (HTTP ${res.status})`,
        );
      }
    })
    .catch((err) =>
      console.error(
        `Failed to fetch badges data for ${username}:`,
        err.message,
      ),
    );

  await Promise.allSettled([livePromise, historyPromise, badgesPromise]);

  // Ensure history is sorted chronologically
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    username,
    ranking,
    badges,
    history,
  };
}

module.exports = fetchUserInfo;
