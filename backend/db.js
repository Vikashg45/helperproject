const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Automatically creates table based on the first row (headers)
async function parseAndStoreData(content) {
  return new Promise((resolve, reject) => {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) return reject(new Error('File must include at least a header and one data row.'));

    const headers = lines[0].split('|').map(h => h.trim());
    const columnDefs = headers.map(h => `\`${h}\` TEXT`).join(', ');
    const placeholders = headers.map(() => '?').join(', ');
    const insertStmt = `INSERT INTO records (${headers.map(h => `\`${h}\``).join(', ')}) VALUES (${placeholders})`;

    db.serialize(() => {
      // Create table if not exists (drops old if necessary — optional)
      db.run(`DROP TABLE IF EXISTS records`);
      db.run(`CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columnDefs})`, (err) => {
        if (err) return reject(err);

        const stmt = db.prepare(insertStmt);
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split('|').map(cell => cell.trim());
          if (row.length === headers.length) {
            stmt.run(row);
          }
        }
        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });
}

module.exports = {
  db,
  parseAndStoreData,
};
