const { db } = require("../db/sqlite");

const RegistrationModel = {
  create: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO registrations (userName, eventId, createdAt, status)
         VALUES (?, ?, ?, 'active')`,
        [userName, eventId, new Date().toISOString()],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    }),

  findActive: (userName, eventId) =>
    new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM registrations 
         WHERE userName=? AND eventId=? AND status='active'`,
        [userName, eventId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    }),

  countActiveByEvent: (eventId) =>
    new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM registrations 
         WHERE eventId=? AND status='active'`,
        [eventId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
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
};

module.exports = RegistrationModel;