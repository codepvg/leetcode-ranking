const axios = require("axios");
const fs = require("fs");
const path = require("path");

const userFilePath = path.join(__dirname, "..", "data", "users.json");

let users = [];

try {
  const rawData = fs.readFileSync(userFilePath, "utf8");
  users = JSON.parse(rawData);
  console.log(`Loaded ${users.length} users from users.json`);
} catch (err) {
  console.error("Failed to load users.json: ", err.message);
  process.exit(1);
}

async function fetchData(url) {
  try {
    const res = await axios.get(url);
    return {
      easySolved: res.data.easySolved,
      mediumSolved: res.data.mediumSolved,
      hardSolved: res.data.hardSolved
    };
  } catch (err) {
    console.error("API failed to respond: ", err.message);
    process.exit(1);
  }
}

function getFileName() {
  const now = new Date();
  now.setDate(now.getDate() - 1);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  let day = now.getDay();
  day = day === 0 ? 7 : day;

  return `${year}-${month}-${date}-${day}.json`;
}

const baseUrl = "https://leetcode-api-faisalshohag.vercel.app/";
const interval = users.length > 10 ? (users.length > 100 ? 9500 : 6500) : 0;
let dailyData = [];

(async () => {
  console.log(" ");
  console.log("Starting daily fetch...");
  for (const user of users) {
    const data = await fetchData(baseUrl + user.id);
    const score = data.easySolved + data.mediumSolved * 3 + data.hardSolved * 5;
    console.log(`${user.name}:`, data);
    dailyData.push(
      {
        name: user.name,
        id: user.id,
        data,
        score 
      }
    );

    if (interval > 0) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  console.log("...");
  console.log(" ");

  console.log("Writing daily data to file...")
  const filepath = path.join(__dirname, "..", "data", "daily", getFileName());
  try {
    fs.writeFileSync(filepath, JSON.stringify(dailyData, null, 2), "utf8");
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }
})();
