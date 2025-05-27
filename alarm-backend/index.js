import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const TASK_STATUS_PATH = path.join(__dirname, "task-status.json");
const QR_LIST_PATH = path.join(__dirname, "qr-list.json");
const QR_TASK_PATH = path.join(__dirname, "qr-task.json");

// Middleware
app.use(express.json());

/**
 * Get today's date in EST (YYYY-MM-DD)
 */
function getTodayEST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const estOffsetMs = -5 * 60 * 60000;
  const est = new Date(utc + estOffsetMs);
  return est.toISOString().slice(0, 10);
}

/**
 * Read a JSON file safely
 */
function safeReadJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Write data to a JSON file
 */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Assign or retrieve today's task
 */
function getOrAssignTodayTask() {
  const today = getTodayEST();
  let task = safeReadJson(QR_TASK_PATH);

  if (task.date !== today) {
    const type = Math.random() < 0.5 ? "math" : "qr";
    const newTask = { date: today, type };

    if (type === "qr") {
      const qrList = safeReadJson(QR_LIST_PATH, []);
      if (qrList.length > 0) {
        const picked = qrList[Math.floor(Math.random() * qrList.length)];
        newTask.qr = { value: picked.value, hint: picked.hint };
      }
    }

    writeJson(QR_TASK_PATH, newTask);
    return newTask;
  }

  return task;
}

/**
 * Check if today's task is complete
 */
function isTaskComplete() {
  const status = safeReadJson(TASK_STATUS_PATH);
  return status.date === getTodayEST();
}

// Routes

app.get("/", (req, res) => {
  res.send("Alarm backend is running.");
});

app.get("/task-status", (req, res) => {
  const complete = isTaskComplete();
  const { date } = safeReadJson(TASK_STATUS_PATH, {});
  res.json({ complete, date });
});

app.post("/mark-complete", (req, res) => {
  const today = getTodayEST();
  writeJson(TASK_STATUS_PATH, { date: today });
  console.log("✅ Task marked complete for", today);
  res.sendStatus(200);
});

app.get("/task-type", (req, res) => {
  const task = getOrAssignTodayTask();
  const response = { type: task.type };

  if (task.type === "qr") {
    response.hint = task.qr?.hint || "QR task assigned, but no hint.";
  }

  res.json(response);
});

app.post("/qr-verify", (req, res) => {
  const task = getOrAssignTodayTask();
  const { value } = req.body;

  if (task.type !== "qr") {
    return res.status(400).json({ ok: false, message: "Today's task is not QR." });
  }

  if (!value || value !== task.qr?.value) {
    return res.status(403).json({ ok: false, message: "Incorrect QR code." });
  }

  writeJson(TASK_STATUS_PATH, { date: getTodayEST() });
  console.log("✅ QR verified:", value);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
