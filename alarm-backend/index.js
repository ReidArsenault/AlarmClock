import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, "task-status.json");

app.use(express.json());

// Ensure task-status.json exists and is valid
function initializeStatusFile() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ date: null }, null, 2));
      console.log("🆕 Created missing task-status.json");
    } else {
      const raw = fs.readFileSync(FILE_PATH, "utf8");
      JSON.parse(raw); // Throws if malformed
    }
  } catch (err) {
    console.warn("⚠️ task-status.json was corrupted. Resetting.");
    fs.writeFileSync(FILE_PATH, JSON.stringify({ date: null }, null, 2));
  }
}

// Call at startup
initializeStatusFile();

// Returns today's date in YYYY-MM-DD format
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// POST /mark-complete → store today's completion date
app.post("/mark-complete", (req, res) => {
  const today = getToday();
  const data = { date: today };
  fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("❌ Error writing task-status.json:", err);
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
      console.warn("⚠️ No task-status.json found:", err.message);
      return res.json({ complete: false, date: null });
    }
    try {
      const { date } = JSON.parse(fileData);
      const complete = date === getToday();
      res.json({ complete, date });
    } catch (e) {
      console.error("❌ Corrupt task-status.json:", e.message);
      res.json({ complete: false, date: null });
    }
  });
});

// Root status
app.get("/", (req, res) => {
  res.send("Alarm backend is running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
