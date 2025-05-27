import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.resolve("./task-status.json");

app.use(express.json());

// Returns today's date in YYYY-MM-DD format
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// POST /mark-complete → store today's completion date
app.post("/mark-complete", (req, res) => {
  const today = getToday();
  const data = { date: today };
  fs.writeFile(FILE_PATH, JSON.stringify(data), (err) => {
    if (err) {
      console.error("Error writing task-status.json:", err);
      return res.status(500).send("Could not save status.");
    }
    console.log("✅ Task marked complete for", today);
    res.sendStatus(200);
  });
});

// GET /task-status → check if task was completed today
app.get("/task-status", (req, res) => {
  fs.readFile(FILE_PATH, "utf8", (err, fileData) => {
    if (err) {
      console.warn("No task-status.json found:", err.message);
      return res.json({ complete: false });
    }
    try {
      const { date } = JSON.parse(fileData);
      const complete = date === getToday();
      res.json({ complete });
    } catch (e) {
      console.error("Corrupt task-status.json:", e.message);
      res.json({ complete: false });
    }
  });
});

// Root status
app.get("/", (req, res) => {
  res.send("Alarm backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
