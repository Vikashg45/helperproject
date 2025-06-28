// 📁 server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parseAndStoreData, db, getHeaders, getHeadersSync } = require('./db'); // ✅ getHeadersSync added

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer();
const TEXT_FILE_PATH = path.join(__dirname, 'data.txt');

app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("❌ No file uploaded.");

    const content = req.file.buffer.toString('utf-8');
    fs.writeFileSync(TEXT_FILE_PATH, content, 'utf8');
    await parseAndStoreData(content);

    console.log("📄 Uploaded File Content:\n", content); // ✅ log uploaded file
    console.log("✅ File parsed and stored");

    res.send('✅ File uploaded and data stored in DB');
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("❌ Failed to upload/parse file: " + (err.message || 'Unknown error'));
  }
});

app.get('/api/data', async (req, res) => {
  const limit = req.query.limit === 'all' ? -1 : parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const sortColumn = req.query.sortColumn;
  const sortOrder = (req.query.sortOrder || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    const allHeaders = await getHeaders();
    const searchableColumns = allHeaders.filter(h => h !== 'id');
    const conditions = [];
    const values = [];

    searchableColumns.forEach(col => {
      const v = req.query[col];
      if (v) {
        conditions.push(`LOWER(\`${col}\`) LIKE ?`);
        values.push(`%${v.toLowerCase()}%`);
      }
    });

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = sortColumn ? `ORDER BY \`${sortColumn}\` ${sortOrder}` : '';
    const selectCols = searchableColumns.map(c => `\`${c}\``).join(', ');

    const countQuery = `SELECT COUNT(*) AS count FROM records ${whereClause}`;
    const dataQuery = `SELECT ${selectCols}, id FROM records ${whereClause} ${orderClause} ${limit !== -1 ? 'LIMIT ? OFFSET ?' : ''}`;

    db.get(countQuery, values, (err, row) => {
      if (err) {
        console.error('❌ Error fetching count:', err);
        return res.status(500).json({ error: err.message });
      }

      const dataValues = limit !== -1 ? [...values, limit, offset] : values;
      db.all(dataQuery, dataValues, (err, rows) => {
        if (err) {
          console.error('❌ Error fetching data rows:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log('📦 Sending rows:', rows.length);
        res.json({ data: rows, total: row.count });
      });
    });
  } catch (e) {
    console.error('❌ Failed in /api/data:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/update-record', (req, res) => {
  const record = req.body;
  if (!record?.id) return res.status(400).json({ error: "'id' required" });

  const keys = Object.keys(record).filter(k => k !== 'id');
  const values = keys.map(k => record[k]);
  const clause = keys.map(k => `\`${k}\` = ?`).join(', ');

  db.run(`UPDATE records SET ${clause} WHERE id = ?`, [...values, record.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });

    db.all('SELECT * FROM records', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const headers = getHeadersSync().filter(h => h !== 'id');
      const lines = [
        `|${headers.join('|')}|`,
        ...rows.map(r => `|${headers.map(h => r[h]).join('|')}|`)
      ];
      fs.writeFileSync(TEXT_FILE_PATH, lines.join('\n'), 'utf8');
      res.json({ message: '✅ Updated' });
    });
  });
});

app.delete('/api/delete-data', (req, res) => {
  db.run("DELETE FROM records", err => {
    if (err) return res.status(500).json({ error: err.message });
    res.send('✅ Deleted all records');
  });
});

app.get('/api/record-count', (req, res) => {
  db.get('SELECT COUNT(*) AS count FROM records', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
