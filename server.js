const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("frontend"));

/* ---------------- HOME ROUTES ---------------- */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(__dirname + "/frontend/leaderboard.html");
});

app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/frontend/about.html");
});

app.get("/registration", (req, res) => {
  res.sendFile(__dirname + "/frontend/registration.html");
});

app.get("/uptime", (req, res) => {
  res.json({ status: "Website is running ✅" });
});

/* ---------------- API: STUDENT HISTORY ---------------- */
app.get("/api/student/:username", async (req, res) => {
  const { username } = req.params;

  try {
    console.log("Fetching history for:", username);

    // 1. Get list of all daily files from GitHub repo
    const apiURL =
  "https://api.github.com/repos/codepvg/leetcode-ranking-data/contents/daily?ref=main";

    const response = await fetch(apiURL);
    const files = await response.json();


    if (!Array.isArray(files)) {
      return res.status(500).json({
        error: "GitHub API failed",
        details: files.message || files,
      });
    }

    let history = [];

    // 2. Loop through each file
    for (const file of files) {
      if (!file.name.endsWith(".json")) continue;

      const fileRes = await fetch(file.download_url);
      const data = await fileRes.json();

      const user = data.find((u) => u.id === username);

      if (user) {
        const date = file.name.split("-").slice(0, 3).join("-");

        history.push({
          date,
          easy: user.data.easySolved,
          medium: user.data.mediumSolved,
          hard: user.data.hardSolved,
        });
      }
    }

    // 3. Sort by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      username,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch student history",
      details: err.message,
    });
  }
});

/* ---------------- 404 ---------------- */
app.use((req, res) => {
  res.status(404).send("Page not found");
});

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});