const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseAndStoreData, db } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ✅ Route to load and parse text file
app.get('/api/load-file', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'GeneratedData.txt');
        const content = fs.readFileSync(filePath, 'utf-8');
        await parseAndStoreData(content);
        res.send('✅ Data loaded and stored from GeneratedData.txt.');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Error reading or parsing file.');
    }
});

// ✅ Route to fetch paginated + searched data
app.get('/api/data', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.toString().toLowerCase() || '';
    const offset = (page - 1) * limit;

    let countQuery = "SELECT COUNT(*) as count FROM records";
    let dataQuery = "SELECT * FROM records";
    const params = [];

    if (search) {
        countQuery += " WHERE LOWER(f1) LIKE ?";
        dataQuery += " WHERE LOWER(f1) LIKE ?";
        params.push(`%${search}%`);
    }

    dataQuery += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    db.get(countQuery, search ? [`%${search}%`] : [], (err, countRow) => {
        if (err) return res.status(500).send(err.message);

        db.all(dataQuery, params, (err, rows) => {
            if (err) return res.status(500).send(err.message);

            res.json({
                data: rows,
                total: countRow.count
            });
        });
    });
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`✅ Server started on http://localhost:${PORT}`);
});
