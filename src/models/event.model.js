const { db } = require("../db/sqlite");

const EventModel = {
  create: (name, totalSeats, eventDate) =>
    new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO events (name, totalSeats, eventDate) VALUES (?, ?, ?)",
        [name, totalSeats, eventDate],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    }),

  getAll: () =>
    new Promise((resolve, reject) => {
      db.all("SELECT * FROM events", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),

  findById: (id) =>
    new Promise((resolve, reject) => {
      db.get("SELECT * FROM events WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }),
};

module.exports = EventModel;