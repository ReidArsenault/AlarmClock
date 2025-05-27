// alarm-backend.js
// Node.js + Express backend for alarm system

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "task-status.json");

app.use(cors());
app.use(express.json());

// Helper to get today's date string
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// Load or initialize task status
function loadStatus() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (e) {
    return {};
  }
}

function saveStatus(status) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(status, null, 2));
}

// GET /task-status
app.get("/task-status", (req, res) => {
  const status = loadStatus();
  const today = getTodayDate();
  const done = status[today] === true;
  res.json({ date: today, status: done ? "complete" : "incomplete" });
});

// POST /mark-complete
app.post("/mark-complete", (req, res) => {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 5 || hour >= 10) {
    return res
      .status(403)
      .json({ error: "Outside allowed time window (5–10 AM)" });
  }

  const status = loadStatus();
  const today = getTodayDate();
  status[today] = true;
  saveStatus(status);

  res.json({ message: "Task marked complete", date: today });
});

// Default route
app.get("/", (req, res) => {
  res.send("Alarm backend is running.");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
