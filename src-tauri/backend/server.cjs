// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { parseAndStoreData, db, getHeadersSync } = require("./db.cjs");


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const TEXT_FILE_PATH = path.join(__dirname, "data.txt");

// ✅ A real queue of pending write jobs
const writeQueue = [];
let isProcessingQueue = false;

function enqueueWriteJob(job) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ job, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue) return;
  if (writeQueue.length === 0) return;
  isProcessingQueue = true;

  const { job, resolve, reject } = writeQueue.shift();
  try {
    const result = await job();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    isProcessingQueue = false;
    processQueue();
  }
}

// Upload
app.post("/api/upload-file", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("❌ No file uploaded.");

  try {
    await enqueueWriteJob(async () => {
      const content = req.file.buffer.toString("utf-8");
      fs.writeFileSync(TEXT_FILE_PATH, content, "utf8");
      await parseAndStoreData(content);
    });

    console.log("✅ File parsed and stored");
    res.send("✅ File uploaded and data stored in DB");
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("❌ Failed to upload/parse file: " + (err.message || "Unknown error"));
  }
});

// Record Count
app.get("/api/record-count", (req, res) => {
  db.get("SELECT COUNT(*) AS count FROM records", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count });
  });
});

// Data Query
app.get("/api/data", (req, res) => {
  const limit = req.query.limit === "all" ? -1 : parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const sortColumn = req.query.sortColumn || "id";
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

  const headers = getHeadersSync().filter((h) => h !== "id");
  let whereClauses = [];
  let params = [];

  for (const key of headers) {
    if (req.query[key]) {
      whereClauses.push(`\`${key}\` LIKE ?`);
      params.push(`%${req.query[key]}%`);
    }
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `
    SELECT * FROM records
    ${whereSQL}
    ORDER BY \`${sortColumn}\` ${sortOrder}
    ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ""}
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(`SELECT COUNT(*) as count FROM records ${whereSQL}`, params, (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        total: countRow.count,
      });
    });
  });
});

// Update
app.post("/api/update-record", async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: "Missing record ID" });

  try {
    await enqueueWriteJob(() => {
      return new Promise((resolve, reject) => {
        const keys = Object.keys(fields);
        const placeholders = keys.map((k) => `\`${k}\` = ?`).join(", ");
        const values = keys.map((k) => fields[k]);

        const sql = `UPDATE records SET ${placeholders} WHERE id = ?`;
        db.run(sql, [...values, id], function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
    });

    res.json({ updated: true });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete
app.delete("/api/delete-data", async (req, res) => {
  console.log("🔥 DELETE /api/delete-data called");
  try {
    await enqueueWriteJob(() => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN EXCLUSIVE TRANSACTION");
          db.run("DELETE FROM records");
          db.run("COMMIT", (err) => {
            if (err) return reject(err);
            fs.writeFileSync(TEXT_FILE_PATH, "", "utf8");
            resolve();
          });
        });
      });
    });

    console.log("✅ All records deleted");
    res.json({ message: "✅ All records deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
