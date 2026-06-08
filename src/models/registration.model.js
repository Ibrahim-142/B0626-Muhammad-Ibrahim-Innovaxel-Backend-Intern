const { db } = require("../db/sqlite");

const RegistrationModel = {
  createAtomic: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO registrations (userName, eventId, createdAt, status)
         SELECT ?, ?, ?, 'active'
         WHERE (SELECT COUNT(*) FROM registrations WHERE eventId = ? AND status = 'active') < (SELECT totalSeats FROM events WHERE id = ?)`,
        [userName, eventId, new Date().toISOString(), eventId, eventId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    }),

  cancel: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.run(
        `UPDATE registrations 
         SET status='cancelled'
         WHERE userName=? AND eventId=? AND status='active'`,
        [userName, eventId],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) {
            reject(new Error("User is not registered for this event"));
          } else {
            resolve(true);
          }
        }
      );
    }),

  findByUserAndEvent: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM registrations 
         WHERE userName=? AND eventId=?`,
        [userName, eventId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    }),

  activateAtomic: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.run(
        `UPDATE registrations 
         SET status='active', createdAt=?
         WHERE userName=? AND eventId=? AND status='cancelled'
           AND (SELECT COUNT(*) FROM registrations WHERE eventId = ? AND status='active') < (SELECT totalSeats FROM events WHERE id = ?)`,
        [new Date().toISOString(), userName, eventId, eventId, eventId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    }),
};

module.exports = RegistrationModel;