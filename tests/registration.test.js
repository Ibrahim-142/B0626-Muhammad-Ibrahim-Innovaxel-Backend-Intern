process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../src/app");
const { initDB, db } = require("../src/db/sqlite");

let server;
let baseUrl;

// Helper to run raw database runs
const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

test.before(async () => {
  await initDB();
  // Clear the database initially
  await runQuery("DELETE FROM registrations");
  await runQuery("DELETE FROM events");
  await runQuery("DELETE FROM sqlite_sequence");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

// 1. Create Event (Success)
test("1. Create Event (Success)", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "NodeJS Workshop",
      totalSeats: 3,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "Event created");
});

// 2. Create Event - Missing Name
test("2. Create Event - Missing Name", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      totalSeats: 3,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "name, totalSeats and eventDate are required",
  });
});

// 3. Create Event - Empty Name
test("3. Create Event - Empty Name", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "    ",
      totalSeats: 3,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Event name cannot be empty",
  });
});

// 4. Create Event - Name Not String
test("4. Create Event - Name Not String", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: 123,
      totalSeats: 3,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Event name must be a string",
  });
});

// 5. Create Event - Seats Zero
test("5. Create Event - Seats Zero", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: 0,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Total seats must be greater than 0",
  });
});

// 6. Create Event - Negative Seats
test("6. Create Event - Negative Seats", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: -5,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Total seats must be greater than 0",
  });
});

// 7. Create Event - Decimal Seats
test("7. Create Event - Decimal Seats", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: 5.5,
      eventDate: "2027-12-31T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Total seats must be an integer",
  });
});

// 8. Create Event - Invalid Date
test("8. Create Event - Invalid Date", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: 10,
      eventDate: "abc",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Invalid event date format",
  });
});

// 9. Create Event - Past Date
test("9. Create Event - Past Date", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: 10,
      eventDate: "2020-01-01T10:00:00Z",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Event date must be in the future",
  });
});

// 10. Create Event - Extra Field
test("10. Create Event - Extra Field", async () => {
  const response = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "React Workshop",
      totalSeats: 10,
      eventDate: "2027-12-31T10:00:00Z",
      hack: true,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Unexpected field(s): hack",
  });
});

// 11. Create Duplicate Event Name
test("11. Create Duplicate Event Name", async () => {
  // Clear "NodeJS Workshop" first so the first POST succeeds and creates it.
  await runQuery("DELETE FROM events WHERE name = 'NodeJS Workshop'");

  // First create
  const res1 = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "NodeJS Workshop",
      totalSeats: 10,
      eventDate: "2027-10-10T10:00:00Z",
    }),
  });
  const body1 = await res1.json();
  assert.strictEqual(res1.status, 200);

  // Then create again
  const res2 = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "NodeJS Workshop",
      totalSeats: 20,
      eventDate: "2027-11-11T10:00:00Z",
    }),
  });
  const body2 = await res2.json();
  assert.strictEqual(res2.status, 409);
  assert.deepStrictEqual(body2, {
    success: false,
    message: "Event name already exists",
  });

  // Restore NodeJS Workshop back to ID 1, seats 3, future date for subsequent registration tests
  await runQuery("DELETE FROM events");
  await runQuery(
    "INSERT INTO events (id, name, totalSeats, eventDate) VALUES (?, ?, ?, ?)",
    [1, "NodeJS Workshop", 3, "2027-12-31T10:00:00Z"]
  );
});

// 12. View Events
test("12. View Events", async () => {
  const response = await fetch(`${baseUrl}/events`);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.strictEqual(body.data.length, 1);
  assert.strictEqual(body.data[0].id, 1);
  assert.strictEqual(body.data[0].name, "NodeJS Workshop");
});

// 13. Register User (Success)
test("13. Register User (Success)", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ali",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, {
    success: true,
    message: "Registered successfully",
  });
});

// 14. Register Second User
test("14. Register Second User", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ahmed",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, {
    success: true,
    message: "Registered successfully",
  });
});

// 15. Register Third User
test("15. Register Third User", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Sara",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, {
    success: true,
    message: "Registered successfully",
  });
});

// 16. Duplicate Registration
test("16. Duplicate Registration", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ali",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 409);
  assert.deepStrictEqual(body, {
    success: false,
    message: "User already registered",
  });
});

// 17. Register Non-Existent Event
test("17. Register Non-Existent Event", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ali",
      eventId: 999,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 404);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Event not found",
  });
});

// 18. Event Full
test("18. Event Full", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Fatima",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 409);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Event is full",
  });
});

// 19. Cancel Registration
test("19. Cancel Registration", async () => {
  const response = await fetch(`${baseUrl}/registrations/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ali",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, {
    success: true,
    message: "Cancelled successfully",
  });
});

// 20. Register After Cancellation
test("20. Register After Cancellation", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Fatima",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, {
    success: true,
    message: "Registered successfully",
  });
});

// 21. Cancel Non-Existent Registration
test("21. Cancel Non-Existent Registration", async () => {
  const response = await fetch(`${baseUrl}/registrations/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "UnknownUser",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "Registration not found",
  });
});

// 22. Register With Missing Fields
test("22. Register With Missing Fields", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "Ali",
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "userName and eventId are required",
  });
});

// 23. Register With Empty User Name
test("23. Register With Empty User Name", async () => {
  const response = await fetch(`${baseUrl}/registrations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "    ",
      eventId: 1,
    }),
  });

  const body = await response.json();
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(body, {
    success: false,
    message: "User name cannot be empty",
  });
});

// 24. Sort and Filter Events (GET /events/sort)
test("24. Sort and Filter Events (GET /events/sort)", async () => {
  // Clear events first
  await runQuery("DELETE FROM registrations");
  await runQuery("DELETE FROM events");

  // Insert test events directly into SQLite (allowing past dates)
  await runQuery(
    "INSERT INTO events (name, totalSeats, eventDate) VALUES (?, ?, ?)",
    ["Past Event", 5, "2020-05-15T10:00:00Z"]
  );
  await runQuery(
    "INSERT INTO events (name, totalSeats, eventDate) VALUES (?, ?, ?)",
    ["Future Event 1", 10, "2027-01-01T10:00:00Z"]
  );
  await runQuery(
    "INSERT INTO events (name, totalSeats, eventDate) VALUES (?, ?, ?)",
    ["Future Event 2", 15, "2028-01-01T10:00:00Z"]
  );

  // Test 1: Default sorting (ascending) and no filtering
  {
    const res = await fetch(`${baseUrl}/events/sort`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Events retrieved");
    assert.strictEqual(body.data.length, 3);
    assert.strictEqual(body.data[0].name, "Past Event");
    assert.strictEqual(body.data[1].name, "Future Event 1");
    assert.strictEqual(body.data[2].name, "Future Event 2");
  }

  // Test 2: Descending sorting and no filtering
  {
    const res = await fetch(`${baseUrl}/events/sort?sort=desc`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 3);
    assert.strictEqual(body.data[0].name, "Future Event 2");
    assert.strictEqual(body.data[1].name, "Future Event 1");
    assert.strictEqual(body.data[2].name, "Past Event");
  }

  // Test 3: Upcoming events only (ascending default)
  {
    const res = await fetch(`${baseUrl}/events/sort?upcoming=true`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.data[0].name, "Future Event 1");
    assert.strictEqual(body.data[1].name, "Future Event 2");
  }

  // Test 4: Upcoming events only (descending)
  {
    const res = await fetch(`${baseUrl}/events/sort?upcoming=true&sort=desc`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.data[0].name, "Future Event 2");
    assert.strictEqual(body.data[1].name, "Future Event 1");
  }
});

