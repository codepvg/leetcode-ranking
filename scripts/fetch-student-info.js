const fs = require("fs");
const path = require("path");

function getFileName(daysAgo) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  let day = now.getDay();
  day = day === 0 ? 7 : day;

  return `${year}-${month}-${date}-${day}.json`;
}

async function fetchStudentHistory(username) {
  let history = [];
  let ranking = null;

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
      "Failed to fetch live global ranking from API wrapper:",
      err.message,
    );
  }

  try {
    // If a local data folder is present, try reading from it first (development helper)
    const localDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
    const localFilePath = path.join(
      localDir,
      "historical-user-data",
      `${username}.json`,
    );

    if (fs.existsSync(localFilePath)) {
      console.log(`[Dev] Loading historical data locally for: ${username}`);
      history = JSON.parse(fs.readFileSync(localFilePath, "utf8"));
    } else {
      // Fallback to fetching from remote GitHub repository (production behavior)
      const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/historical-user-data/${username}.json`;
      const response = await fetch(rawUrl);
      if (response.ok) {
        history = await response.json();
      } else {
        console.warn(
          `No historical data found for user: ${username} (HTTP ${response.status})`,
        );
      }
    }
  } catch (err) {
    console.error(
      `Failed to fetch historical data for ${username}:`,
      err.message,
    );
  }

  // Ensure history is sorted chronologically
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    username,
    ranking,
    history,
  };
}

module.exports = fetchStudentHistory;
