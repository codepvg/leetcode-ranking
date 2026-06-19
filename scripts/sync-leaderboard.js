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
  let history = [];

  if (fs.existsSync(userHistoryPath)) {
    try {
      history = JSON.parse(fs.readFileSync(userHistoryPath, "utf8"));
    } catch (err) {
      console.error(
        `Failed to parse history for ${user.id}, resetting:`,
        err.message,
      );
    }
  }

  const dateStr = getFileName(0).split("-").slice(0, 3).join("-");
  const existingIndex = history.findIndex((entry) => entry.date === dateStr);

  const newEntry = {
    date: dateStr,
    easy: user.data.easySolved,
    medium: user.data.mediumSolved,
    hard: user.data.hardSolved,
  };

  if (existingIndex !== -1) {
    history[existingIndex] = newEntry;
  } else {
    history.push(newEntry);
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  atomicWrite(userHistoryPath, history);
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
      previousRanks[user.id] = user.originalRank || idx + 1;
    });
  }

  currentSorted.forEach((user, idx) => {
    const currentRank = user.originalRank || idx + 1;

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
      if (Array.isArray(inactiveData.inactiveUsers)) {
        inactiveData.inactiveUsers.forEach((id) => inactiveUsersSet.add(id));
        console.log(
          `Loaded ${inactiveUsersSet.size} stale users into skip-filter lookup Set.`,
        );
      }
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
    if (oldUser.id) historyMap.set(oldUser.id, oldUser);
  });

  const interval = 0;
  let overallData = [];

  console.log(" ");
  console.log("Starting daily fetch...");
  for (const user of users) {
    if (inactiveUsersSet.has(user.id)) {
      const cache = historyMap.get(user.id);
      if (cache) {
        overallData.push({
          name: cache.name,
          id: cache.id,
          data: {
            easySolved: cache.data?.easySolved || 0,
            mediumSolved: cache.data?.mediumSolved || 0,
            hardSolved: cache.data?.hardSolved || 0,
            totalSolved: cache.data?.totalSolved || 0,
          },
          score: cache.score || 0,
        });
        continue;
      }
    }

    const data = await fetchData(baseUrl + user.id);
    if (!data) {
      console.log(`${user.name}: skipped (API error)`);
      continue;
    }
    const score = data.easySolved + data.mediumSolved * 3 + data.hardSolved * 5;
    console.log(`${user.name}:`, data);
    overallData.push({
      name: user.name,
      id: user.id,
      data,
      score,
    });

    if (interval > 0) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
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

  previousOverall = [];
  try {
    const rawPrevious = fs.readFileSync(overallFilepath, "utf8");
    previousOverall = JSON.parse(rawPrevious);
  } catch (err) {
    console.warn("No previous overall.json found, skipping diff.");
  }

  await computeRankChanges(overallData, "overall.json");
  try {
    atomicWrite(overallFilepath, overallData);
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  let dailyData = JSON.parse(JSON.stringify(overallData));
  console.log(" ");
  console.log("Loading previous day's file...");
  const previousDayFilepath = path.join(DATA_DIR, "daily", getFileName(1));
  let previousData = [];
  try {
    const rawData = fs.readFileSync(previousDayFilepath, "utf8");
    previousData = JSON.parse(rawData);
    console.log("Previous day's data loaded successfully");
  } catch (err) {
    console.error(`Failed to load previous file: `, err.message);
    process.exit(1);
  }

  console.log(" ");
  console.log("Calculating daily progress...");
  for (let i = 0; i < dailyData.length; i++) {
    const previousIndex = previousData.findIndex(
      (obj) => obj.id === dailyData[i].id,
    );
    if (previousIndex == -1) {
      dailyData.splice(i--, 1);
      continue;
    }

    dailyData[i].data.easySolved -= previousData[previousIndex].data.easySolved;
    dailyData[i].data.mediumSolved -=
      previousData[previousIndex].data.mediumSolved;
    dailyData[i].data.hardSolved -= previousData[previousIndex].data.hardSolved;

    dailyData[i].score =
      dailyData[i].data.easySolved +
      dailyData[i].data.mediumSolved * 3 +
      dailyData[i].data.hardSolved * 5;
    dailyData[i].data.totalSolved =
      dailyData[i].data.easySolved +
      dailyData[i].data.mediumSolved +
      dailyData[i].data.hardSolved;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  stableSortByScore(dailyData);
  assignCompetitionRanks(dailyData);
  console.log("Writing sorted daily data to daily.json...");
  const dailyFilepath = path.join(DATA_DIR, "daily.json");
  await computeRankChanges(dailyData, "daily.json");
  try {
    atomicWrite(dailyFilepath, dailyData);
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  let weeklyData = JSON.parse(JSON.stringify(overallData));
  console.log(" ");
  console.log("Loading previous week's file...");
  const previousWeekFilepath = path.join(DATA_DIR, "daily", getFileName(7));
  previousData = [];
  try {
    const rawData = fs.readFileSync(previousWeekFilepath, "utf8");
    previousData = JSON.parse(rawData);
    console.log("Previous week's data loaded successfully");
  } catch (err) {
    console.error(`Failed to load previous file: `, err.message);
    process.exit(1);
  }

  console.log(" ");
  console.log("Calculating weekly progress...");
  for (let i = 0; i < weeklyData.length; i++) {
    const previousIndex = previousData.findIndex(
      (obj) => obj.id === weeklyData[i].id,
    );
    if (previousIndex == -1) {
      weeklyData.splice(i--, 1);
      continue;
    }
    weeklyData[i].data.easySolved -=
      previousData[previousIndex].data.easySolved;
    weeklyData[i].data.mediumSolved -=
      previousData[previousIndex].data.mediumSolved;
    weeklyData[i].data.hardSolved -=
      previousData[previousIndex].data.hardSolved;
    weeklyData[i].score =
      weeklyData[i].data.easySolved +
      weeklyData[i].data.mediumSolved * 3 +
      weeklyData[i].data.hardSolved * 5;
    weeklyData[i].data.totalSolved =
      weeklyData[i].data.easySolved +
      weeklyData[i].data.mediumSolved +
      weeklyData[i].data.hardSolved;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  stableSortByScore(weeklyData);
  assignCompetitionRanks(weeklyData);
  console.log("Writing sorted weekly data to weekly.json...");
  const weeklyFilepath = path.join(DATA_DIR, "weekly.json");
  await computeRankChanges(weeklyData, "weekly.json");
  try {
    atomicWrite(weeklyFilepath, weeklyData);
    console.log("Weekly data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  let monthlyData = JSON.parse(JSON.stringify(overallData));
  console.log(" ");
  console.log("Loading previous month's file...");
  const previousMonthFilepath = path.join(DATA_DIR, "daily", getFileName(30));
  previousData = [];
  try {
    const rawData = fs.readFileSync(previousMonthFilepath, "utf8");
    previousData = JSON.parse(rawData);
    console.log("Previous week's data loaded successfully");
  } catch (err) {
    console.error(`Failed to load previous file: `, err.message);
    process.exit(1);
  }

  console.log(" ");
  console.log("Calculating monthly progress...");
  for (let i = 0; i < monthlyData.length; i++) {
    const previousIndex = previousData.findIndex(
      (obj) => obj.id === monthlyData[i].id,
    );
    if (previousIndex == -1) {
      monthlyData.splice(i--, 1);
      continue;
    }
    monthlyData[i].data.easySolved -=
      previousData[previousIndex].data.easySolved;
    monthlyData[i].data.mediumSolved -=
      previousData[previousIndex].data.mediumSolved;
    monthlyData[i].data.hardSolved -=
      previousData[previousIndex].data.hardSolved;
    monthlyData[i].score =
      monthlyData[i].data.easySolved +
      monthlyData[i].data.mediumSolved * 3 +
      monthlyData[i].data.hardSolved * 5;
    monthlyData[i].data.totalSolved =
      monthlyData[i].data.easySolved +
      monthlyData[i].data.mediumSolved +
      monthlyData[i].data.hardSolved;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  stableSortByScore(monthlyData);
  assignCompetitionRanks(monthlyData);
  console.log("Writing sorted monthly data to monthly.json...");
  const monthlyFilepath = path.join(DATA_DIR, "monthly.json");
  await computeRankChanges(monthlyData, "monthly.json");
  try {
    atomicWrite(monthlyFilepath, monthlyData);
    console.log("Monthly data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }

  console.log("Generating changes.json...");
  const changesFilepath = path.join(DATA_DIR, "changes.json");
  try {
    // Build lookup of previous solve counts and ranks
    const previousMap = {};
    previousOverall.forEach((user, idx) => {
      previousMap[user.id] = {
        rank: user.originalRank || idx + 1,
        totalSolved: user.data.totalSolved || 0,
      };
    });

    const rankChanges = [];
    const newUsers = [];
    let totalNewSolves = 0;
    let usersWithNewSolves = 0;

    overallData.forEach((user, idx) => {
      const currentRank = user.originalRank || idx + 1;
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
