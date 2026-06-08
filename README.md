# Event Registration System API

A lightweight, robust, and highly concurrent Event Registration System backend built using **Node.js**, **Express**, and **SQLite**. 

This system handles event creation, user registration, and cancellation, featuring built-in concurrency controls to guarantee that events cannot be overbooked under high-traffic parallel request scenarios.

---

## 🚀 Key Features

- **Event Management**: Create events with details like capacity limit (`totalSeats`) and date (`eventDate`).
- **Advanced Sorting & Filtering**: Retrieve events sorted by date (`asc` / `desc`) and filtered by status (e.g., upcoming events only).
- **Concurrency-Safe Registration**: Registers users for events atomically at the database layer to prevent overbooking.
- **Clean Cancellation & Reactivation Flow**: Supports cancellation of active registrations and atomic reactivation.
- **Strict Validation**: Request validation middlewares to sanitize input formats and enforce valid payload bounds.
- **Standardized Error Handling**: Unified JSON error outputs with proper HTTP status codes.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express (v5.2.1)
- **Database**: SQLite (using `sqlite3` for schema and queries)
- **Development Tooling**: Nodemon for hot reloading
- **Testing**: Native Node.js Test Runner (`node --test`)

---

## 📦 Getting Started

### 1. Installation
Clone or download the project files and install dependencies:
```bash
npm install
```

### 2. Run the Server
Start the development server with hot-reload enabled:
```bash
npm run dev
```
By default, the server will start on port `3000` (or `PORT` environment variable if configured).

### 3. Run Tests
This project uses the native Node.js test runner. You can run all test suites (including concurrency and registration edge cases) using:
```bash
npm test
```
To run only the concurrency tests:
```bash
npm run test:concurrency
```

---

## 🗂️ API Documentation

### Event Endpoints

#### 1. Create Event
- **Endpoint**: `POST /events`
- **Request Body**:
  ```json
  {
    "name": "NodeJS Workshop",
    "totalSeats": 50,
    "eventDate": "2027-12-31T10:00:00Z"
  }
  ```
- **Responses**:
  - `200 OK`: Event created successfully.
  - `400 Bad Request`: Missing fields, invalid types, negative/non-integer seats, past dates, or unexpected fields.
  - `409 Conflict`: Event name already exists.

#### 2. List All Events
- **Endpoint**: `GET /events`
- **Response**: Returns a full list of all events in the system.
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "NodeJS Workshop",
        "totalSeats": 50,
        "eventDate": "2027-12-31T10:00:00Z"
      }
    ],
    "message": "Events retrieved"
  }
  ```

#### 3. Sort & Filter Events (New Route)
- **Endpoint**: `GET /events/sort`
- **Query Parameters**:
  - `sort` (optional): `asc` (default) or `desc` to sort events chronologically by `eventDate`.
  - `upcoming` (optional): Set to `true` to return only events where the `eventDate` is in the future relative to the system's current time.
- **Example request**: `GET /events/sort?upcoming=true&sort=desc`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "name": "Advanced React Masterclass",
        "totalSeats": 20,
        "eventDate": "2028-06-15T09:00:00Z"
      },
      {
        "id": 1,
        "name": "NodeJS Workshop",
        "totalSeats": 50,
        "eventDate": "2027-12-31T10:00:00Z"
      }
    ],
    "message": "Events retrieved"
  }
  ```

---

### Registration Endpoints

#### 1. Register User for Event
- **Endpoint**: `POST /registrations/register`
- **Request Body**:
  ```json
  {
    "userName": "Alice",
    "eventId": 1
  }
  ```
- **Responses**:
  - `200 OK`: Registered successfully.
  - `400 Bad Request`: Invalid arguments, missing fields, or registration for a past event.
  - `404 Not Found`: Event does not exist.
  - `409 Conflict`: User already registered (with an active status) or event is full (seats capacity reached).

#### 2. Cancel Registration
- **Endpoint**: `POST /registrations/cancel`
- **Request Body**:
  ```json
  {
    "userName": "Alice",
    "eventId": 1
  }
  ```
- **Responses**:
  - `200 OK`: Cancelled successfully.
  - `400 Bad Request`: Registration not found or already cancelled.
  - `404 Not Found`: Event not found.

---

## ⚡ Concurrency & Overbooking Prevention

Traditional approaches fetch the current registration count and the event capacity in two separate database calls before deciding whether to register a user. Under high parallel request traffic (concurrency), this pattern creates **race conditions**, leading to overbooking (e.g., registering 6 people for a 5-seat event).

This backend solves the concurrency issue by implementing **Atomic SQL Queries** in the SQLite database layer.

### How it Works:
1. **Atomic Insertion**:
   When registering a user, we use a single query that conditionally inserts the row only if the limit is not exceeded:
   ```sql
   INSERT INTO registrations (userName, eventId, createdAt, status)
   SELECT ?, ?, ?, 'active'
   WHERE (SELECT COUNT(*) FROM registrations WHERE eventId = ? AND status = 'active') 
         < (SELECT totalSeats FROM events WHERE id = ?)
   ```
2. **Atomic Reactivation**:
   If a user has a cancelled registration and wants to register again, we update the status atomically with a check constraint:
   ```sql
   UPDATE registrations 
   SET status='active', createdAt=?
   WHERE userName=? AND eventId=? AND status='cancelled'
     AND (SELECT COUNT(*) FROM registrations WHERE eventId = ? AND status='active') 
         < (SELECT totalSeats FROM events WHERE id = ?)
   ```

Using this approach, SQLite handles the comparison lock inside a single write-cycle transaction, ensuring absolute consistency even with hundreds of concurrent requests.

---

## 🏗️ Request Lifecycle & Architecture

The application adopts a **Separation of Concerns (SoC)** approach, grouping functionality into independent layers. 

### Visual Request Flow:
```text
 Client (Request)
       │
       ▼
 ┌──────────┐
 │ Server   │  (Entry Point: server.js & src/app.js)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │ Router   │  (Route Mapping: src/routes/)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │Middleware│  (Validation: src/middlewares/validate.middleware.js)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │Controller│  (Request/Response Handler: src/controllers/)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │ Service  │  (Business Logic: src/services/)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │  Model   │  (Database Queries: src/models/)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │ Database │  (SQLite: db/sqlite.js)
 └────┬─────┘
      │
      ├──────► [Success Result] ──► Controller ──► Client (Response)
      │
      └──────► [Error Thrown] ──► Error Middleware ──► Client (Response)
```

### Layer Roles:
1. **Entry Point (`src/app.js`)**: Configures Express, mounts routes, and registers the global error-handler middleware.
2. **Routes (`src/routes/`)**: Acts as a path resolver mapping request URIs and HTTP verbs to appropriate validators and controllers.
3. **Middlewares (`src/middlewares/`)**: Intercepts requests to validate parameter data types, formats, and structural layouts before they hit controllers.
4. **Controllers (`src/controllers/`)**: Extracts payloads from the request, routes calls to relevant service layers, and translates outcomes into structured JSON HTTP responses.
5. **Services (`src/services/`)**: Orchestrates domain/business logic validation (e.g. validating date rules or checking existences).
6. **Models (`src/models/`)**: Interfaces directly with SQLite, executing atomic SQL queries.
7. **Error Handler (`src/middlewares/error.middleware.js`)**: Captures all bubbled runtime errors and formats them into uniform client-facing responses.
