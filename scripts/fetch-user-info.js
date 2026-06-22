async function fetchUserInfo(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!username || !usernameRegex.test(username)) {
    throw new Error("Invalid username format");
  }

  let history = [];
  let ranking = null;
  let badges = [];

  try {
    const liveApiUrl = `https://leetcode-api-dun.vercel.app/${username}`;
    const apiResponse = await fetch(liveApiUrl);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      // Captures the live ranking directly from the endpoint payload
      ranking = apiData.ranking || 0;
    }
  } catch (err) {
    console.error(
      "Failed to fetch live profile ranking from API wrapper:",
      err.message,
    );
  }

  try {
    const cacheBuster = Date.now();
    const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/user-data/${username}.json?t=${cacheBuster}`;
    const response = await fetch(rawUrl);
    if (response.ok) {
      history = await response.json();
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

  try {
    const cacheBuster = Date.now();
    const badgesUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/badges.json?t=${cacheBuster}`;
    const response = await fetch(badgesUrl);

    if (response.ok) {
      const badgesMap = await response.json();
      // Extract badges for this specific username, fallback to empty array if none
      badges = badgesMap[username] || [];
    } else {
      console.warn(
        `Could not retrieve badges.json from GitHub (HTTP ${response.status})`,
      );
    }
  } catch (err) {
    console.error(`Failed to fetch badges data for ${username}:`, err.message);
  }

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
