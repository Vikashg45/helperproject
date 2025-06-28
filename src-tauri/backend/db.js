const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'database.db'));

let headers = [];

function loadHeadersFromDB() {
  return new Promise((resolve) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='records'", (err, row) => {
      if (!row || err) return resolve();
      db.all("PRAGMA table_info(records)", [], (err, columns) => {
        if (!err && columns) {
          headers = columns
            .map(col => col.name)
            .filter(name => name !== 'id'); // exclude 'id'
        }
        resolve();
      });
    });
  });
}

function parseAndStoreData(content) {
  return new Promise((resolve, reject) => {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return reject(new Error('Need at least header + data'));

    headers = lines[0].replace(/^\||\|$/g, '').split('|').map(h => h.trim());
    const cols = headers.map(h => `\`${h}\` TEXT`).join(', ');
    const placeholders = headers.map(() => '?').join(', ');

    db.serialize(() => {
      db.run('DROP TABLE IF EXISTS records');
      db.run(`CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, ${cols})`, err => {
        if (err) return reject(err);

        const stmt = db.prepare(`INSERT INTO records (${headers.map(h => `\`${h}\``).join(', ')}) VALUES (${placeholders})`);

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].replace(/^\||\|$/g, '').split('|').map(v => v.trim());
          if (values.length === headers.length) {
            stmt.run(values);
          }
        }

        stmt.finalize(err => err ? reject(err) : resolve());
      });
    });
  });
}

function getHeaders() {
  return ['id', ...headers];
}

// Needed for write-back in /update-record
function getHeadersSync() {
  return ['id', ...headers];
}

// Load headers at startup
loadHeadersFromDB();

module.exports = {
  db,
  parseAndStoreData,
  getHeaders,
  getHeadersSync,
};
