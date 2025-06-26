const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseAndStoreData, db } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer(); // memory storage

// Upload endpoint
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("❌ No file uploaded.");
    const content = req.file.buffer.toString('utf-8');
    await parseAndStoreData(content);
    res.send('✅ File uploaded and data stored in DB');
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("❌ Failed to upload/parse file: " + (err.message || 'Unknown error'));
  }
});

// Record count endpoint
app.get('/api/record-count', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM records", [], (err, row) => {
    if (err) {
      console.error("❌ Failed to get record count:", err);
      return res.status(500).json({ error: "Failed to fetch record count" });
    }
    res.json({ count: row.count });
  });
});

// Delete all records endpoint
app.delete('/api/delete-data', (req, res) => {
  db.run("DELETE FROM records", (err) => {
    if (err) {
      console.error("❌ Failed to delete records:", err);
      return res.status(500).send("❌ Failed to delete data: " + err.message);
    }
    res.send("✅ Data deleted from database");
  });
});

// Data fetching endpoint with pagination and search
app.get('/api/data', (req, res) => {
  let { page = 1, limit = 20, search = '' } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  search = search.toLowerCase();

  const offset = (page - 1) * limit;

  const searchableColumns = ['col1', 'col2', 'col3']; // adjust as needed

  let searchQuery = '';
  let paramsForCount = [];
  let paramsForData = [];

  if (search) {
    const likeClauses = searchableColumns.map(col => `LOWER(${col}) LIKE ?`).join(' OR ');
    searchQuery = `WHERE ${likeClauses}`;
    const likeParams = Array(searchableColumns.length).fill(`%${search}%`);
    paramsForCount = likeParams;
    paramsForData = [...likeParams, limit, offset];
  } else {
    paramsForCount = [];
    paramsForData = [limit, offset];
  }

  const countQuery = `SELECT COUNT(*) as count FROM records ${searchQuery}`;
  const dataQuery = `SELECT * FROM records ${searchQuery} LIMIT ? OFFSET ?`;

  db.get(countQuery, paramsForCount, (err, countRow) => {
    if (err) {
      console.error('❌ Count query error:', err);
      return res.status(500).json({ error: 'Failed to fetch count' });
    }

    db.all(dataQuery, paramsForData, (err, rows) => {
      if (err) {
        console.error('❌ Data query error:', err);
        return res.status(500).json({ error: 'Failed to fetch data' });
      }

      res.json({
        data: rows,
        total: countRow.count,
      });
    });
  });
});

// ✅ Update record endpoint
app.post('/api/update-record', (req, res) => {
  const record = req.body;

  if (!record || !record.id) {
    return res.status(400).send("❌ Invalid request. 'id' field is required.");
  }

  const keys = Object.keys(record).filter(k => k !== 'id');
  const values = keys.map(k => record[k]);

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE records SET ${setClause} WHERE id = ?`;

  db.run(sql, [...values, record.id], function (err) {
    if (err) {
      console.error('❌ Failed to update record:', err);
      return res.status(500).send('❌ Update failed: ' + err.message);
    }

    if (this.changes === 0) {
      return res.status(404).send('⚠️ Record not found.');
    }

    res.send('✅ Record updated successfully.');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
