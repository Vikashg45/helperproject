const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseAndStoreData, db } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer(); // use memory storage

// ✅ Upload & parse text file from UI
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("❌ No file uploaded.");

    const content = req.file.buffer.toString('utf-8');
    console.log("File content received:", content); // Debug log
    await parseAndStoreData(content);

    res.send('✅ File uploaded and data stored in DB');
  } catch (err) {
    console.error("❌ Upload error details:", err); // Log full error object
    res.status(500).send("❌ Failed to upload/parse file: " + (err.message || 'Unknown error'));
  }
});

// ✅ Paginated + searched data
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  db.get("SELECT COUNT(*) as count FROM records", [], (err, countRow) => {
    if (err) return res.status(500).send("❌ Error counting records: " + err.message);

    db.all("SELECT * FROM records LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
      if (err) return res.status(500).send("❌ Error fetching records: " + err.message);

      res.json({
        data: rows,
        total: countRow.count
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});