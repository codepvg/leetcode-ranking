const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const dailyDir = path.join(DATA_DIR, "daily");
const historyDir = path.join(DATA_DIR, "historical-user-data");

if (!fs.existsSync(dailyDir)) {
  console.error(`Daily directory not found at: ${dailyDir}`);
  process.exit(1);
}

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

console.log("Reading daily snapshots...");
const files = fs
  .readdirSync(dailyDir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}-\d\.json$/.test(f));
console.log(`Found ${files.length} daily snapshots.`);

const userHistories = {};

for (const file of files) {
  const filePath = path.join(dailyDir, file);
  const dateStr = file.split("-").slice(0, 3).join("-");

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data)) continue;

    for (const user of data) {
      if (!user.id || !user.data) continue;

      if (!userHistories[user.id]) {
        userHistories[user.id] = [];
      }

      // Check if entry for this date already exists for the user
      const exists = userHistories[user.id].some(
        (entry) => entry.date === dateStr,
      );
      if (!exists) {
        userHistories[user.id].push({
          date: dateStr,
          easy: user.data.easySolved || 0,
          medium: user.data.mediumSolved || 0,
          hard: user.data.hardSolved || 0,
        });
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}

console.log("Writing user history files...");
let count = 0;
for (const username of Object.keys(userHistories)) {
  // Sort by date chronologically
  userHistories[username].sort((a, b) => new Date(a.date) - new Date(b.date));

  const userFile = path.join(historyDir, `${username}.json`);
  try {
    fs.writeFileSync(
      userFile,
      JSON.stringify(userHistories[username], null, 2),
      "utf8",
    );
    count++;
  } catch (err) {
    console.error(`Failed to write history file for ${username}:`, err.message);
  }
}

console.log(`Migration complete. Generated history files for ${count} users.`);
