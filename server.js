const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

const fetchStudentHistory = require("./scripts/fetch-student-info");

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


app.get("/api/student/:username", async (req, res) => {
  try {
    const data = await fetchStudentHistory(req.params.username);
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
