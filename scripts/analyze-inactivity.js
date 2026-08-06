"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const { setupRetryInterceptor } = require("./lib/retry-interceptor");
setupRetryInterceptor();

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

  const stateFilePath = path.join(DATA_DIR, "activity-state.json");
  let activityState = {};
  try {
    if (fs.existsSync(stateFilePath)) {
      activityState = JSON.parse(fs.readFileSync(stateFilePath, "utf8"));
      console.log("Loaded activity-state.json cache.");
    }
  } catch (err) {
    console.warn("Failed to load activity-state.json, starting fresh cache.");
  }

  const baseUrl = "https://leetcode-api-dun.vercel.app/";
  const inactiveUsers = [];
  const unreachableUsers = [];
  const now = new Date();
  const currentTimeMs = now.getTime();

  console.log(" ");
  console.log("Starting daily full sync inactivity analysis...");

  const CONCURRENCY_LIMIT = 20;

  for (let i = 0; i < users.length; i += CONCURRENCY_LIMIT) {
    const batch = users.slice(i, i + CONCURRENCY_LIMIT);

    await Promise.all(
      batch.map(async (user) => {
        const username = user.id;
        const cachedRecord = activityState[username];

        if (
          cachedRecord &&
          cachedRecord.safeUntil &&
          currentTimeMs < cachedRecord.safeUntil
        ) {
          console.log(
            `${username}: Active (Skipped via cache, safe until ${new Date(cachedRecord.safeUntil).toISOString().split("T")[0]})`,
          );
          return;
        }

        const profile = await fetchData(baseUrl + username);
        if (!profile) {
          console.log(`${username}: unreachable (API error after retries)`);
          unreachableUsers.push(username);
          return;
        }

        const calendar = profile.submissionCalendar;
        const timestamps = calendar ? Object.keys(calendar).map(Number) : [];

        if (timestamps.length === 0) {
          console.log(`${username}: Inactive (no submission calendar history)`);
          inactiveUsers.push(username);
          return;
        }

        const latestTimestampSeconds = Math.max(...timestamps);
        const lastActiveDate = new Date(latestTimestampSeconds * 1000);

        const diffTime = Math.abs(now - lastActiveDate);
        const diffDays = Math.floor(diffTime / MS_IN_A_DAY);

        const safeUntilTimeMs =
          latestTimestampSeconds * 1000 + THRESHOLD_DAYS * MS_IN_A_DAY;

        activityState[username] = {
          safeUntil: safeUntilTimeMs,
          lastChecked: currentTimeMs,
        };

        if (diffDays > THRESHOLD_DAYS) {
          console.log(`${username}: Inactive (${diffDays} days ago)`);
          inactiveUsers.push(username);
        } else {
          console.log(`${username}: Active (${diffDays} days ago)`);
        }
      }),
    );
  }

  console.log("...");
  console.log(" ");

  const outputData = {
    generatedAt: now.toISOString(),
    thresholdDays: THRESHOLD_DAYS,
    inactiveUsers: inactiveUsers.sort(),
    unreachableUsers: unreachableUsers.sort(),
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

  console.log("Writing activity state cache to activity-state.json...");
  try {
    atomicWrite(stateFilePath, activityState);
    console.log("Activity state cache updated successfully!");
  } catch (err) {
    console.error("Failed to write activity-state.json: ", err.message);
    process.exit(1);
  }
})();
