"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const THRESHOLD_DAYS = 90;
const MS_IN_A_DAY = 1000 * 60 * 60 * 24;

async function fetchData(url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    return res.data;
  } catch (err) {
    console.error(`API failed for ${url}: ${err.message}`);
    return null;
  }
}

(async () => {
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  console.log(`Using data directory: ${DATA_DIR}`);

  console.log("Loading leaderboard users...");
  const overallFilePath = path.join(DATA_DIR, "overall.json");
  let users = [];
  try {
    const rawData = fs.readFileSync(overallFilePath, "utf8");
    users = JSON.parse(rawData);
    console.log(`Loaded ${users.length} users from overall.json`);
  } catch (err) {
    console.error("Failed to load overall.json: ", err.message);
    process.exit(1);
  }

  const baseUrl = "https://leetcode-api-dun.vercel.app/";
  const inactiveUsers = [];
  const now = new Date();

  console.log(" ");
  console.log("Starting inactivity analysis...");

  for (const user of users) {
    const username = user.username || user.id;
    if (!user.totalSolved || user.totalSolved === 0) {
      inactiveUsers.push(username);
      continue;
    }

    const profile = await fetchData(baseUrl + username);
    if (!profile) {
      console.log(`${username}: skipped (API error)`);
      continue;
    }

    const calendar = profile.submissionCalendar;
    const timestamps = calendar ? Object.keys(calendar).map(Number) : [];

    if (timestamps.length === 0) {
      console.log(`${username}: Inactive (no submission calendar)`);
      inactiveUsers.push(username);
      continue;
    }

    const latestTimestampSeconds = Math.max(...timestamps);
    const lastActiveDate = new Date(latestTimestampSeconds * 1000);

    const diffTime = Math.abs(now - lastActiveDate);
    const diffDays = Math.floor(diffTime / MS_IN_A_DAY);

    if (diffDays > THRESHOLD_DAYS) {
      console.log(`${username}: Inactive (${diffDays} days ago)`);
      inactiveUsers.push(username);
    } else {
      console.log(`${username}: Active (${diffDays} days ago)`);
    }
  }

  console.log("...");
  console.log(" ");

  const outputData = {
    generatedAt: now.toISOString(),
    thresholdDays: THRESHOLD_DAYS,
    inactiveUsers: inactiveUsers.sort(),
  };

  console.log("Writing inactivity analysis data to inactive-users.json...");
  const outputPath = path.join(DATA_DIR, "inactive-users.json");
  try {
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
    console.log("Inactivity analysis data saved successfully");
  } catch (err) {
    console.error("Failed to write inactive-users.json: ", err.message);
    process.exit(1);
  }
})();
