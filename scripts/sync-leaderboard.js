"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");

function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const tmpPath = path.join(
    dir,
    `${base}.tmp.${process.pid}.${Date.now()}${ext}`,
  );

  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

async function fetchData(url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    return {
      easySolved: res.data.easySolved || 0,
      mediumSolved: res.data.mediumSolved || 0,
      hardSolved: res.data.hardSolved || 0,
    };
  } catch (err) {
    console.error(`API failed for ${url}: ${err.message}`);
    return null;
  }
}

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

function updateUserHistory(user, DATA_DIR) {
  const historyDir = path.join(DATA_DIR, "user-data");
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const userHistoryPath = path.join(historyDir, `${user.id}.json`);
  let profileData = { leaderboardRanks: {}, history: [] };

  if (fs.existsSync(userHistoryPath)) {
    try {
      const rawData = JSON.parse(fs.readFileSync(userHistoryPath, "utf8"));
      if (Array.isArray(rawData)) {
        profileData.history = rawData;
      } else {
        profileData = rawData;
        if (!profileData.history) profileData.history = [];
      }
    } catch (err) {
      console.error(
        `Failed to parse history for ${user.id}, resetting:`,
        err.message,
      );
    }
  }

  const dateStr = getFileName(0).split("-").slice(0, 3).join("-");
  const existingIndex = profileData.history.findIndex(
    (entry) => entry.date === dateStr,
  );

  const newEntry = {
    date: dateStr,
    easy: user.data.easySolved,
    medium: user.data.mediumSolved,
    hard: user.data.hardSolved,
  };

  if (existingIndex !== -1) {
    profileData.history[existingIndex] = newEntry;
  } else {
    profileData.history.push(newEntry);
  }

  profileData.history.sort((a, b) => new Date(a.date) - new Date(b.date));

  atomicWrite(userHistoryPath, profileData);
}

function assignCompetitionRanks(sortedData) {
  let currentRank = 1;
  for (let i = 0; i < sortedData.length; i++) {
    if (i > 0 && sortedData[i].score < sortedData[i - 1].score) {
      currentRank = i + 1;
    }
    sortedData[i].originalRank = currentRank;
  }
}

function stableSortByScore(dataArray) {
  dataArray.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });
}

async function getYesterdaySnapshot(filePath) {
  const owner = "codepvg";
  const repo = "leetcode-ranking-data";
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const targetDate = d.toISOString().split("T")[0];
  const until = `${targetDate}T23:59:59Z`;
  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&until=${until}&per_page=1`;

  const headers = { "User-Agent": "CodePVG-App" };
  if (process.env.DATA_REPO_TOKEN) {
    headers["Authorization"] = `token ${process.env.DATA_REPO_TOKEN}`;
  }

  try {
    const commitResponse = await axios.get(commitsUrl, { headers });
    const commits = commitResponse.data;

    if (!commits || commits.length === 0) {
      console.warn(
        `No commits found for ${filePath} on or before ${targetDate}.`,
      );
      return null;
    }

    const yesterdaySHA = commits[0].sha;
    console.log(
      `📌 Using Commit for ${filePath}: "${commits[0].commit.message}" (SHA: ${yesterdaySHA})`,
    );

    const rawFileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${yesterdaySHA}/${filePath}`;
    const fileResponse = await axios.get(rawFileUrl);
    return fileResponse.data;
  } catch (error) {
    console.error(
      `Error fetching historical data for ${filePath}:`,
      error.message,
    );
    return null;
  }
}

async function computeRankChanges(currentSorted, filename) {
  let previousRanks = {};
  const previousData = await getYesterdaySnapshot(filename);

  if (previousData && Array.isArray(previousData)) {
    previousData.forEach((user, idx) => {
      previousRanks[user.id] = idx + 1;
    });
  }

  currentSorted.forEach((user, idx) => {
    const currentRank = idx + 1;

    if (previousRanks[user.id] === undefined) {
      user.rankChange = "NEW";
    } else {
      const delta = previousRanks[user.id] - currentRank;
      if (delta > 0) user.rankChange = `+${delta}`;
      else if (delta < 0) user.rankChange = `${delta}`;
      else user.rankChange = "=";
    }
  });
}

/**
 * Processes a timeframe-based leaderboard (daily/weekly/monthly) by computing
 * per-user deltas from a previous snapshot, sorting, ranking, and writing output.
 *
 * @param {Array} sourceData - The overall dataset to deep-clone and process
 * @param {string} DATA_DIR - Path to the data directory
 * @param {string} periodName - Label for the timeframe ("daily", "weekly", "monthly")
 * @param {number} daysAgo - Number of days to look back for the snapshot file
 */
async function processTimeframe(sourceData, DATA_DIR, periodName, daysAgo) {
  const data = JSON.parse(JSON.stringify(sourceData));
  console.log(" ");
  console.log(`Loading previous ${periodName}'s file...`);
  const previousFilepath = path.join(DATA_DIR, "daily", getFileName(daysAgo));
  let previousData = [];
  try {
    const rawData = fs.readFileSync(previousFilepath, "utf8");
    previousData = JSON.parse(rawData);
    console.log(`Previous ${periodName}'s data loaded successfully`);
  } catch (err) {
    console.error(`Failed to load previous file: `, err.message);
    process.exit(1);
  }

  console.log(" ");
  console.log(`Calculating ${periodName} progress...`);
  for (let i = 0; i < data.length; i++) {
    const previousIndex = previousData.findIndex(
      (obj) => obj.id === data[i].id,
    );
    if (previousIndex == -1) {
      data.splice(i--, 1);
      continue;
    }
    data[i].data.easySolved -= previousData[previousIndex].data.easySolved;
    data[i].data.mediumSolved -= previousData[previousIndex].data.mediumSolved;
    data[i].data.hardSolved -= previousData[previousIndex].data.hardSolved;
    data[i].score =
      data[i].data.easySolved +
      data[i].data.mediumSolved * 3 +
      data[i].data.hardSolved * 5;
    data[i].data.totalSolved =
      data[i].data.easySolved +
      data[i].data.mediumSolved +
      data[i].data.hardSolved;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  stableSortByScore(data);
  assignCompetitionRanks(data);
  console.log(`Writing sorted ${periodName} data to ${periodName}.json...`);
  const filepath = path.join(DATA_DIR, `${periodName}.json`);
  await computeRankChanges(data, `${periodName}.json`);
  try {
    atomicWrite(filepath, data);
    console.log(`${periodName} data saved successfully`);
    return data;
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }
}

(async () => {
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  console.log(`Using data directory: ${DATA_DIR}`);

  // Clean up leftover tmp files from previous crashes
  const tmpCleanupDirs = [DATA_DIR, path.join(DATA_DIR, "daily")];
  tmpCleanupDirs.forEach((dirPath) => {
    try {
      if (fs.existsSync(dirPath)) {
        const tmpFiles = fs
          .readdirSync(dirPath)
          .filter((f) => f.includes(".tmp."));
        tmpFiles.forEach((f) => {
          const filePath = path.join(dirPath, f);
          fs.unlinkSync(filePath);
          console.log(`Cleaned up leftover tmp file: ${f}`);
        });
      }
    } catch (err) {
      console.warn(`Failed to clean tmp files in ${dirPath}:`, err.message);
    }
  });

  console.log("Loading users...");
  const userFilePath = path.join(DATA_DIR, "users.json");
  let users = [];
  try {
    const rawData = fs.readFileSync(userFilePath, "utf8");
    users = JSON.parse(rawData);
    console.log(`Loaded ${users.length} users from users.json`);
  } catch (err) {
    console.error("Failed to load users.json: ", err.message);
    process.exit(1);
  }

  const baseUrl = "https://leetcode-api-dun.vercel.app/";

  const inactiveFilePath = path.join(DATA_DIR, "inactive-users.json");
  const inactiveUsersSet = new Set();
  try {
    if (fs.existsSync(inactiveFilePath)) {
      const rawInactive = fs.readFileSync(inactiveFilePath, "utf8");
      const inactiveData = JSON.parse(rawInactive);
      inactiveData.inactiveUsers.forEach((id) => inactiveUsersSet.add(id));
      console.log(
        `Loaded ${inactiveUsersSet.size} stale users into skip-filter lookup Set.`,
      );
    }
  } catch (err) {
    console.warn(
      "Warning: Could not parse inactive-users.json, proceeding without skips:",
      err.message,
    );
  }

  const overallFilepath = path.join(DATA_DIR, "overall.json");
  let previousOverall = [];
  try {
    if (fs.existsSync(overallFilepath)) {
      previousOverall = JSON.parse(fs.readFileSync(overallFilepath, "utf8"));
    }
  } catch (err) {
    console.warn(
      "No previous overall.json found, cannot recycle stale records.",
    );
  }

  const historyMap = new Map();
  previousOverall.forEach((oldUser) => {
    historyMap.set(oldUser.id, oldUser);
  });

  let overallData = [];

  console.log(" ");
  console.log("Starting daily fetch...");

  const CONCURRENCY_LIMIT = 50;

  for (let i = 0; i < users.length; i += CONCURRENCY_LIMIT) {
    const batch = users.slice(i, i + CONCURRENCY_LIMIT);

    await Promise.all(
      batch.map(async (user) => {
        if (inactiveUsersSet.has(user.id)) {
          const cache = historyMap.get(user.id);
          if (cache) {
            console.log(`${user.name}: recycled (inactive)`);
            overallData.push(cache);
            return;
          }
        }

        const data = await fetchData(baseUrl + user.id);
        if (!data) {
          console.log(`${user.name}: skipped (API error)`);
          return;
        }

        const score =
          data.easySolved + data.mediumSolved * 3 + data.hardSolved * 5;
        console.log(`${user.name}:`, Object.values(data).join(" / "));

        overallData.push({
          name: user.name,
          id: user.id,
          data,
          score,
        });
      }),
    );
  }
  console.log("...");
  console.log(" ");

  console.log("Writing daily data to file...");
  const filepath = path.join(DATA_DIR, "daily", getFileName(0));
  try {
    atomicWrite(filepath, overallData);
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  console.log("Updating historical user files...");
  let historyUpdateFailures = 0;
  overallData.forEach((user) => {
    try {
      updateUserHistory(user, DATA_DIR);
    } catch (err) {
      historyUpdateFailures++;
      console.error(`Failed to update history for ${user.id}:`, err.message);
    }
  });
  if (historyUpdateFailures > 0) {
    console.warn(`${historyUpdateFailures} user history update(s) failed.`);
  } else {
    console.log("Historical user files updated successfully");
  }

  overallData.forEach((user) => {
    user.data.totalSolved =
      user.data.easySolved + user.data.mediumSolved + user.data.hardSolved;
  });
  console.log("Sorting collected data...");
  stableSortByScore(overallData);
  assignCompetitionRanks(overallData);
  console.log("Writing sorted daily data to overall file...");

  await computeRankChanges(overallData, "overall.json");
  try {
    atomicWrite(overallFilepath, overallData);
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  // Process timeframe-based leaderboards using the shared function
  const dailyData = await processTimeframe(overallData, DATA_DIR, "daily", 1);
  const weeklyData = await processTimeframe(overallData, DATA_DIR, "weekly", 7);
  const monthlyData = await processTimeframe(
    overallData,
    DATA_DIR,
    "monthly",
    30,
  );

  const overallMap = new Map(
    overallData.map((u) => [
      u.id,
      { rank: u.originalRank || "--", change: u.rankChange || "=" },
    ]),
  );
  const dailyMap = new Map(
    dailyData.map((u) => [
      u.id,
      { rank: u.originalRank || "--", change: u.rankChange || "=" },
    ]),
  );
  const weeklyMap = new Map(
    weeklyData.map((u) => [
      u.id,
      { rank: u.originalRank || "--", change: u.rankChange || "=" },
    ]),
  );
  const monthlyMap = new Map(
    monthlyData.map((u) => [
      u.id,
      { rank: u.originalRank || "--", change: u.rankChange || "=" },
    ]),
  );

  const formatChange = (changeStr) => {
    if (changeStr === "=" || changeStr === "NEW") return 0;
    return parseInt(changeStr, 10) || 0;
  };

  overallData.forEach((user) => {
    const userHistoryPath = path.join(DATA_DIR, "user-data", `${user.id}.json`);
    if (!fs.existsSync(userHistoryPath)) return;

    try {
      const currentProfile = JSON.parse(
        fs.readFileSync(userHistoryPath, "utf8"),
      );

      const overallInfo = overallMap.get(user.id) || {
        rank: "--",
        change: "=",
      };
      const dailyInfo = dailyMap.get(user.id) || { rank: "--", change: "=" };
      const weeklyInfo = weeklyMap.get(user.id) || { rank: "--", change: "=" };
      const monthlyInfo = monthlyMap.get(user.id) || {
        rank: "--",
        change: "=",
      };

      currentProfile.leaderboardRanks = {
        overall: {
          rank: overallInfo.rank,
          change: formatChange(overallInfo.change),
        },
        daily: { rank: dailyInfo.rank, change: formatChange(dailyInfo.change) },
        weekly: {
          rank: weeklyInfo.rank,
          change: formatChange(weeklyInfo.change),
        },
        monthly: {
          rank: monthlyInfo.rank,
          change: formatChange(monthlyInfo.change),
        },
      };

      atomicWrite(userHistoryPath, currentProfile);
    } catch (err) {
      console.error(`Failed to inject ranks for user ${user.id}:`, err.message);
    }
  });

  console.log("Generating changes.json...");
  const changesFilepath = path.join(DATA_DIR, "changes.json");
  try {
    // Build lookup of previous solve counts and ranks
    const previousMap = {};
    previousOverall.forEach((user, idx) => {
      previousMap[user.id] = {
        rank: idx + 1,
        totalSolved: user.data.totalSolved || 0,
      };
    });

    const rankChanges = [];
    const newUsers = [];
    let totalNewSolves = 0;
    let usersWithNewSolves = 0;

    overallData.forEach((user, idx) => {
      const currentRank = idx + 1;
      const prev = previousMap[user.id];

      if (!prev) {
        // User not in previous snapshot = newly joined
        newUsers.push(user.name);
        return;
      }

      // Check solve count delta since last sync
      const currentTotal = user.data.totalSolved || 0;
      const delta = currentTotal - prev.totalSolved;
      if (delta > 0) {
        totalNewSolves += delta;
        usersWithNewSolves++;
      }

      // Check rank movement since last sync
      if (prev.rank !== currentRank) {
        rankChanges.push({
          username: user.name,
          id: user.id,
          old_rank: prev.rank,
          new_rank: currentRank,
          rank_delta: prev.rank - currentRank, // +ve = moved up
        });
      }
    });

    const noChanges =
      rankChanges.length === 0 && newUsers.length === 0 && totalNewSolves === 0;

    atomicWrite(changesFilepath, {
      sync_time: new Date().toISOString(),
      rank_changes: rankChanges,
      new_users: newUsers,
      total_new_solves: totalNewSolves,
      users_with_new_solves: usersWithNewSolves,
      no_changes: noChanges,
    });
    console.log("changes.json saved successfully");
  } catch (err) {
    console.error("Failed to write changes.json: ", err.message);
  }

  console.log("Writing sync timestamp...");
  const syncFilepath = path.join(DATA_DIR, "last-sync.json");
  try {
    const now = new Date();
    const nextSync = new Date(now.getTime() + 5 * 60 * 1000);
    atomicWrite(syncFilepath, {
      lastSync: now.toISOString(),
      nextSync: nextSync.toISOString(),
    });
    console.log("Sync timestamp saved successfully");
  } catch (err) {
    console.error(`Failed to write sync file: `, err.message);
  }
})();
