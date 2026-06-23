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

  const userDataPromise = fetch(rawUrl)
    .then(async (res) => {
      if (res.ok) {
        const userJson = await res.json();
        
        // Auto-Migration Check & Routing
        if (Array.isArray(userJson)) {
           history = userJson;
        } else {
           history = userJson.history || [];
           badges = userJson.badges || [];
        }
      } else {
        console.warn(
          `No user data found for user: ${username} (HTTP ${res.status})`,
        );
      }
    })
    .catch((err) =>
      console.error(
        `Failed to fetch user data for ${username}:`,
        err.message,
      ),
    );

  await Promise.allSettled([livePromise, userDataPromise]);

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
