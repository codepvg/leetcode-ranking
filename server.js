const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "frontend")));

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

app.get("/api/overall", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "overall.json"));
});

app.get("/api/weekly", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "weekly.json"));
});

app.get("/api/daily", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "daily.json"));
});

app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
