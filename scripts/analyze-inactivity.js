"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const THRESHOLD_DAYS = 90;
const MS_IN_A_DAY = 1000 * 60 * 60 * 24;

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
    return res.data;
  } catch (err) {
    console.error(`API failed for ${url}: ${err.message}`);
    return null;
  }
}

(async () => {
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
  console.log(`Using data directory: ${DATA_DIR}`);

  console.log("Loading master user list...");
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
  const now = new Date();

  console.log(" ");
  console.log("Starting daily full sync inactivity analysis...");

  for (const user of users) {
    const username = user.id;

    const profile = await fetchData(baseUrl + username);
    if (!profile) {
      console.log(`${username}: skipped (API error)`);
      continue;
    }

    const easySolved = profile.easySolved || 0;
    const mediumSolved = profile.mediumSolved || 0;
    const hardSolved = profile.hardSolved || 0;
    const totalSolved = easySolved + mediumSolved + hardSolved;

    if (totalSolved === 0) {
      console.log(`💤 ${username}: Inactive (0 questions solved)`);
      inactiveUsers.push(username);
      continue;
    }

    const calendar = profile.submissionCalendar;
    const timestamps = calendar ? Object.keys(calendar).map(Number) : [];

    if (timestamps.length === 0) {
      console.log(`💤 ${username}: Inactive (no submission calendar history)`);
      inactiveUsers.push(username);
      continue;
    }

    const latestTimestampSeconds = Math.max(...timestamps);
    const lastActiveDate = new Date(latestTimestampSeconds * 1000);

    const diffTime = Math.abs(now - lastActiveDate);
    const diffDays = Math.floor(diffTime / MS_IN_A_DAY);

    if (diffDays > THRESHOLD_DAYS) {
      console.log(`💤 ${username}: Inactive (${diffDays} days ago)`);
      inactiveUsers.push(username);
    } else {
      console.log(`✅ ${username}: Active (${diffDays} days ago)`);
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
    atomicWrite(outputPath, outputData);
    console.log("Inactivity analysis data updated successfully!");
  } catch (err) {
    console.error("Failed to write inactive-users.json: ", err.message);
    process.exit(1);
  }
})();
