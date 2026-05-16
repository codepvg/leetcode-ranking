const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

app.get("/uptime", (req, res) => {
  res.json({ status: "Website is running ✅" });
});


app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
