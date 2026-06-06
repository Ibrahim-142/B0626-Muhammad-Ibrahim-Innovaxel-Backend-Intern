const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE,
          totalSeats INTEGER,
          eventDate TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userName TEXT,
          eventId INTEGER,
          createdAt TEXT,
          status TEXT DEFAULT 'active',
          UNIQUE(userName, eventId)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

module.exports = { db, initDB };