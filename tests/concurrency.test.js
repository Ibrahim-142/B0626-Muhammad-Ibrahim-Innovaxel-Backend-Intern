process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../src/app");
const { initDB, db } = require("../src/db/sqlite");

let server;
let baseUrl;

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

test.before(async () => {
  await initDB();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test("Concurrency - Overbooking Prevention", async () => {
  // Clear the database
  await runQuery("DELETE FROM registrations");
  await runQuery("DELETE FROM events");
  await runQuery("DELETE FROM sqlite_sequence");

  // Create event with 5 seats
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Concurrency Workshop",
      totalSeats: 5,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });
  const eventBody = await response.json();
  assert.strictEqual(response.status, 200);

  // Send 10 concurrent registration requests for different users
  const userNames = Array.from({ length: 10 }, (_, i) => `User_${i}`);
  const requests = userNames.map(name => 
    fetch(`${baseUrl}/registrations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: name,
        eventId: 1,
      }),
    })
  );

  const responses = await Promise.all(requests);
  
  let successCount = 0;
  let fullCount = 0;

  for (const resp of responses) {
    const body = await resp.json();
    if (resp.status === 200) {
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, "Registered successfully");
      successCount++;
    } else if (resp.status === 409) {
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, "Event is full");
      fullCount++;
    } else {
      assert.fail(`Unexpected status code: ${resp.status}`);
    }
  }

  assert.strictEqual(successCount, 5, "Exactly 5 registrations should succeed");
  assert.strictEqual(fullCount, 5, "Exactly 5 registrations should fail with 'Event is full'");

  // Check database count
  const dbResult = await new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM registrations WHERE eventId = 1 AND status = 'active'", (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  assert.strictEqual(dbResult, 5, "Database must have exactly 5 active registrations");
});

test("Concurrency - Duplicate Requests Safe Handling", async () => {
  // Clear the database
  await runQuery("DELETE FROM registrations");
  await runQuery("DELETE FROM events");
  await runQuery("DELETE FROM sqlite_sequence");

  // Create event with 10 seats
  await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate Request Workshop",
      totalSeats: 10,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  // Send 5 concurrent registration requests for the SAME user
  const requests = Array.from({ length: 5 }, () => 
    fetch(`${baseUrl}/registrations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "DuplicateUser",
        eventId: 1,
      }),
    })
  );

  const responses = await Promise.all(requests);

  let successCount = 0;
  let duplicateCount = 0;

  for (const resp of responses) {
    const body = await resp.json();
    if (resp.status === 200) {
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, "Registered successfully");
      successCount++;
    } else if (resp.status === 409) {
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, "User already registered");
      duplicateCount++;
    } else {
      assert.fail(`Unexpected status code: ${resp.status}`);
    }
  }

  assert.strictEqual(successCount, 1, "Exactly 1 registration should succeed");
  assert.strictEqual(duplicateCount, 4, "Exactly 4 registrations should fail with 'User already registered'");

  // Check database count
  const dbResult = await new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM registrations WHERE eventId = 1 AND status = 'active'", (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  assert.strictEqual(dbResult, 1, "Database must have exactly 1 active registration for the user");
});
