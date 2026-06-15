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
  const inactiveUsers = [];
  const neverActiveUsers = [];
  const now = new Date();

  console.log(" ");
  console.log("Starting inactivity analysis...");

  for (const user of users) {
    const profile = await fetchData(baseUrl + user.id);
    if (!profile) {
      console.log(`${user.name}: skipped (API error)`);
      continue;
    }

    const calendar = profile.submissionCalendar;
    const timestamps = calendar ? Object.keys(calendar).map(Number) : [];

    // Case 1: Checking for users with absolutely no history (0 score baseline profiles)
    if (timestamps.length === 0) {
      console.log(`${user.name}: Never Active`);
      neverActiveUsers.push(user.id);
      continue;
    }

    // Case 2: Extracting the absolute latest submission unix timestamp marker
    const latestTimestampSeconds = Math.max(...timestamps);
    const lastActiveDate = new Date(latestTimestampSeconds * 1000);

    // Compute day delta between execution runtime and user's last platform interaction
    const diffTime = Math.abs(now - lastActiveDate);
    const diffDays = Math.floor(diffTime / MS_IN_A_DAY);

    if (diffDays > THRESHOLD_DAYS) {
      console.log(`${user.name}: Inactive (${diffDays} days ago)`);
      inactiveUsers.push(user.id);
    } else {
      console.log(`${user.name}: Active (${diffDays} days ago)`);
    }
  }

  console.log("...");
  console.log(" ");

  // Formatting output schema matching maintainer's blueprint specification
  const outputData = {
    generatedAt: now.toISOString(),
    thresholdDays: THRESHOLD_DAYS,
    inactiveUsers: inactiveUsers.sort(),
    neverActiveUsers: neverActiveUsers.sort(),
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
