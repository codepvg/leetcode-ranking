const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchData(url) {
  try {
    const res = await axios.get(url);
    return {
      easySolved: res.data.easySolved || 0,
      mediumSolved: res.data.mediumSolved || 0,
      hardSolved: res.data.hardSolved || 0
    };
  } catch (err) {
    console.error("API failed to respond: ", err.message);
    process.exit(1);
  }
}

function getFileName(daysAgo) {
  const now = new Date();
  now.setDate(now.getDate() - 1 - daysAgo);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  let day = now.getDay();
  day = day === 0 ? 7 : day;

  return `${year}-${month}-${date}-${day}.json`;
}

(async () => {
  console.log("Loading users...")
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

  const baseUrl = "https://leetcode-api-dun.vercel.app/";
  const interval = 0;
  let overallData = [];

  console.log(" ");
  console.log("Starting daily fetch...");
  for (const user of users) {
    const data = await fetchData(baseUrl + user.id);
    const score = data.easySolved + data.mediumSolved * 3 + data.hardSolved * 5;
    console.log(`${user.name}:`, data);
    overallData.push(
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
  const filepath = path.join(__dirname, "..", "data", "daily", getFileName(0));
  try {
    fs.writeFileSync(filepath, JSON.stringify(overallData, null, 2), "utf8");
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }
  console.log("Sorting collected data...");
  overallData.sort((a, b) => b.score - a.score);
  console.log("Writing sorted daily data to overall file...")
  const overallFilepath = path.join(__dirname, "..", "data", "overall.json");
  try {
    fs.writeFileSync(overallFilepath, JSON.stringify(overallData, null, 2), "utf8");
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }


  dailyData = JSON.parse(JSON.stringify(overallData));
  console.log(" ");
  console.log("Loading previous day's file...");
  const previousDayFilepath = path.join(__dirname, "..", "data", "daily", getFileName(1));
  previousData = [];
  try {
    const rawData = fs.readFileSync(previousDayFilepath, "utf8");
    previousData = JSON.parse(rawData);
    console.log("Previous day's data loaded successfully");
  } catch (err) {
    console.error(`Failed to load previous file: `, err.message);
    process.exit(1);
  }

  console.log(" ");
  console.log("Calculating daily progress...")
  for (let i = 0; i < dailyData.length; i++) {
    const previousIndex = previousData.findIndex(obj => obj.id === dailyData[i].id);
    if (previousIndex == -1) {
      dailyData.splice(i--, 1);
      continue;
    }
    dailyData[i].data.easySolved -= previousData[previousIndex].data.easySolved;
    dailyData[i].data.mediumSolved -= previousData[previousIndex].data.mediumSolved;
    dailyData[i].data.hardSolved -= previousData[previousIndex].data.hardSolved;
    dailyData[i].score = dailyData[i].data.easySolved + dailyData[i].data.mediumSolved * 3 + dailyData[i].data.hardSolved * 5;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  dailyData.sort((a, b) => b.score - a.score);

  console.log("Writing sorted daily data to daily.json...")
  const dailyFilepath = path.join(__dirname, "..", "data", "daily.json");
  try {
    fs.writeFileSync(dailyFilepath, JSON.stringify(dailyData, null, 2), "utf8");
    console.log("Daily data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }


  weeklyData = JSON.parse(JSON.stringify(overallData));
  console.log(" ");
  console.log("Loading previous week's file...");
  const previousWeekFilepath = path.join(__dirname, "..", "data", "daily", getFileName(7));
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
  console.log("Calculating weekly progress...")
  for (let i = 0; i < weeklyData.length; i++) {
    const previousIndex = previousData.findIndex(obj => obj.id === weeklyData[i].id);
    if (previousIndex == -1) {
      weeklyData.splice(i--, 1);
      continue;
    }
    weeklyData[i].data.easySolved -= previousData[previousIndex].data.easySolved;
    weeklyData[i].data.mediumSolved -= previousData[previousIndex].data.mediumSolved;
    weeklyData[i].data.hardSolved -= previousData[previousIndex].data.hardSolved;
    weeklyData[i].score = weeklyData[i].data.easySolved + weeklyData[i].data.mediumSolved * 3 + weeklyData[i].data.hardSolved * 5;
  }
  console.log("Calculation done");
  console.log("");

  console.log("Sorting calculated data...");
  weeklyData.sort((a, b) => b.score - a.score);

  console.log("Writing sorted weekly data to weekly.json...")
  const weeklyFilepath = path.join(__dirname, "..", "data", "weekly.json");
  try {
    fs.writeFileSync(weeklyFilepath, JSON.stringify(weeklyData, null, 2), "utf8");
    console.log("Weekly data saved successfully");
  } catch (err) {
    console.error(`Failed to write json file: `, err.message);
    process.exit(1);
  }
})();
