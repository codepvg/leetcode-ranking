"use strict";

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

async function calculateStreaks(history) {
  if (!history || history.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastUpdated: null };
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate = null;
  let previousTotal = -1;

  for (const entry of sortedHistory) {
    const currentTotal =
      (entry.easy || 0) + (entry.medium || 0) + (entry.hard || 0);
    const entryDate = new Date(entry.date);

    if (currentTotal > previousTotal) {
      if (!lastActiveDate) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round(
          (entryDate - lastActiveDate) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, currentStreak);
      lastActiveDate = entryDate;
    }

    previousTotal = currentTotal;
  }

  return {
    currentStreak,
    longestStreak,
    lastUpdated: lastActiveDate
      ? lastActiveDate.toISOString().split("T")[0]
      : null,
  };
}

async function runBackfill() {
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  const userDataDir = path.join(DATA_DIR, "user-data");

  try {
    const files = await fs.readdir(userDataDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(userDataDir, file);
      const userData = JSON.parse(await fs.readFile(filePath, "utf8"));

      const streaks = await calculateStreaks(userData.history);

      userData.currentStreak = streaks.currentStreak;
      userData.longestStreak = streaks.longestStreak;
      userData.streakLastUpdated = streaks.lastUpdated;

      await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    }
  } catch (err) {
    console.error(`Backfill failed: ${err.message}`);
    process.exit(1);
  }
}

runBackfill();
