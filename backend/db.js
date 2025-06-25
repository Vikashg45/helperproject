const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

function parseAndStoreData(content) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Parsing content:", content); // Debug log
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (lines.length < 2) return reject("❌ File must contain at least one data row.");

      const headers = lines[0].replace(/^(\|)+|(\|)+$/g, '').split('|').map(h => h.trim());
      console.log("Parsed headers:", headers, "Count:", headers.length); // Debug log

      if (headers.length !== 86) return reject(`❌ Header must contain 86 columns. Found: ${headers.length}`);

      const createFields = headers.map(col => `${col} TEXT`).join(', ');
      const tableName = 'records';

      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${createFields})`, (err) => {
          if (err) {
            console.error("❌ Table creation error:", err);
            return reject("❌ Failed to create table: " + err.message);
          }
          console.log("✅ Table created or exists with headers:", headers);

          db.run(`DELETE FROM ${tableName}`, (deleteErr) => {
            if (deleteErr && !deleteErr.message.includes('no such table')) {
              console.error("❌ Delete error:", deleteErr);
              return reject("❌ Failed to clear old data: " + deleteErr.message);
            }
            console.log("✅ Old data cleared");

            const insertStmt = db.prepare(
              `INSERT INTO ${tableName} (${headers.join(',')}) VALUES (${headers.map(() => '?').join(',')})`
            );

            let insertedCount = 0;

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].replace(/^(\|)+|(\|)+$/g, '').split('|').map(v => v.trim() || null);
              console.log(`Processing row ${i + 1}:`, values, "Count:", values.length); // Debug log

              if (values.length !== 86) {
                console.warn(`⚠️ Skipping line ${i + 1}: Expected 86 values, found ${values.length}`);
                continue;
              }

              insertStmt.run(values, (err) => {
                if (err) {
                  console.error(`❌ Error inserting row ${i + 1}:`, err.message);
                } else {
                  console.log(`✅ Row ${i + 1} inserted successfully`);
                  insertedCount++;
                }
              });
            }

            insertStmt.finalize((err) => {
              if (err) {
                console.error("❌ Finalize error:", err);
                return reject("❌ Error finalizing insert: " + err.message);
              }
              console.log(`✅ Total inserted rows: ${insertedCount}`);
              resolve();
            });
          });
        });
      });
    } catch (e) {
      console.error("❌ Parsing error:", e);
      reject("❌ Error parsing content: " + e.message);
    }
  });
}

module.exports = { db, parseAndStoreData };