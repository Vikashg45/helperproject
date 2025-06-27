const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseAndStoreData, db } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer();

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

app.get('/api/data', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search?.toLowerCase() || '';
  const searchableColumns = ['col1', 'col2', 'col3'];

  let whereClause = '';
  let searchParams = [];

  if (search) {
    const likeClause = searchableColumns.map(col => `LOWER(\`${col}\`) LIKE ?`).join(' OR ');
    whereClause = `WHERE ${likeClause}`;
    searchParams = Array(searchableColumns.length).fill(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) as count FROM records ${whereClause}`;
  const dataQuery = `SELECT * FROM records ${whereClause} LIMIT ? OFFSET ?`;

  db.get(countQuery, searchParams, (err, countRow) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch count' });

    db.all(dataQuery, [...searchParams, limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch data' });

      res.json({ data: rows, total: countRow.count });
    });
  });
});

app.post('/api/update-record', (req, res) => {
  const record = req.body;
  if (!record || !record.id) return res.status(400).json({ error: "'id' required" });

  const keys = Object.keys(record).filter(k => k !== 'id');
  const values = keys.map(k => record[k]);

  const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
  const sql = `UPDATE records SET ${setClause} WHERE id = ?`;

  db.run(sql, [...values, record.id], function (err) {
    if (err) return res.status(500).json({ error: '❌ Update failed: ' + err.message });
    if (this.changes === 0) return res.status(404).json({ error: '⚠️ Record not found' });
    res.json({ message: '✅ Record updated successfully' });
  });
});

app.delete('/api/delete-data', (req, res) => {
  db.run("DELETE FROM records", [], (err) => {
    if (err) return res.status(500).json({ error: "❌ Failed to delete data: " + err.message });
    res.send("✅ Data deleted");
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server started at http://localhost:${PORT}`);
});
