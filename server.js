const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const fetchStudentHistory = require("./scripts/fetch-student-info");

app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use(cors());
app.use(express.static(path.join(__dirname, "frontend")));

/* ---------------- HOME ROUTES ---------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "leaderboard.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "about.html"));
});

app.get("/registration", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "registration.html"));
});

app.get("/uptime", (req, res) => {
  res.json({ status: "Website is running ✅" });
});

app.get("/user/:username", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "user.html"));
});

const studentCache = new Map();

app.get("/api/student/:username", async (req, res) => {
  const username = req.params.username;

  if (studentCache.has(username)) {
    const cached = studentCache.get(username);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return res.json(cached.data);
    }
  }

  try {
    const data = await fetchStudentHistory(username);

    studentCache.set(username, { timestamp: Date.now(), data });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch student details",
      details: err.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
