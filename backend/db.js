const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

// Create the table if not exists with 85 columns
const fields = Array.from({ length: 85 }, (_, i) => `f${i + 1} TEXT`).join(', ');
db.run(`CREATE TABLE IF NOT EXISTS records (${fields})`);

function parseAndStoreData(content) {
    return new Promise((resolve, reject) => {
        const lines = content
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (lines.length < 2) {
            console.error("❌ Not enough lines in file");
            return reject("File does not contain data rows.");
        }

        const headers = lines[0].split('|').filter(Boolean);
        console.log(`🧠 Header count: ${headers.length}`); // Should be 85

        const insertStmt = db.prepare(
            `INSERT INTO records (${headers.join(',')}) VALUES (${headers.map(() => '?').join(',')})`
        );

        let insertedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('|').filter(Boolean);

            if (values.length !== headers.length) {
                console.warn(`⚠️ Skipping row ${i + 1}: expected ${headers.length}, got ${values.length}`);
                continue;
            }

            insertStmt.run(values);
            insertedCount++;
        }

        insertStmt.finalize((err) => {
            if (err) return reject(err);
            console.log(`✅ Inserted ${insertedCount} rows into database`);
            resolve();
        });
    });
}

module.exports = {
    db,
    parseAndStoreData,
};
