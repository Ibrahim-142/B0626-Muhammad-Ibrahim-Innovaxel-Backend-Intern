# Event Registration System - Request Lifecycle & Architecture

Welcome! This guide is designed to help beginners understand how data flows through this Node.js, Express, and SQLite backend application.

---

## The Request-Response Lifecycle at a Glance

When a client (like a web browser or Postman) interacts with this backend, the request travels through a series of layers in a strict, logical sequence. Here is the visual path of a request:

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
      └──────► [Success Result] ──► Controller ──► Client (Response)
      │
      └──────► [Error Thrown] ──► Error Middleware ──► Client (Response)
```

---

## Step-by-Step Request Lifecycle

Let’s trace exactly what happens when a client sends a request (for example: `POST /registrations/register` to sign up a user for an event).

### Step 1: Entry Point (`server.js` & `src/app.js`)
* **What happens:** The server starts up in [server.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/server.js) and listens on a port. The application setup is configured in [src/app.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/app.js).
* **Role:** This is the reception desk of our application. Express parses incoming JSON data (`express.json()`) and forwards the request to the router based on the URL path.

### Step 2: Routing (`src/routes/`)
* **What happens:** Express looks at the URL path (e.g., `/registrations/register`) and matches it to the correct router.
* **Role:** The routers (like [registration.routes.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/routes/registration.routes.js)) act as a map. They define which middleware and controllers should handle specific HTTP verbs (`GET`, `POST`, etc.).

### Step 3: Middleware Validation (`src/middlewares/`)
* **What happens:** Before the request reaches our main logic, validation middleware in [validate.middleware.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/middlewares/validate.middleware.js) intercepts it.
* **Role:** This is the bouncer. It checks if the client sent the correct fields:
  * Are required fields like `userName` and `eventId` present?
  * Are they of the correct data types (string and integer)?
  * Are values sanitized (trimmed of empty space)?
* **Outcome:** If validation fails, the middleware returns a `400 Bad Request` response immediately, stopping the request from going further. If validation passes, `next()` is called, and it moves to the Controller.

### Step 4: Controller Handler (`src/controllers/`)
* **What happens:** The controller (like `register` in [registration.controller.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/controllers/registration.controller.js)) takes over.
* **Role:** The controller is the traffic cop. It doesn't write database queries or perform complex checks itself. Its only job is to:
  1. Extract parameters from the request (`req.body`).
  2. Call the appropriate service function to do the heavy lifting.
  3. Send a clean JSON response back to the client (`res.json()`) or catch errors and pass them to the global error handler (`next(error)`).

### Step 5: Service Layer (`src/services/`)
* **What happens:** The service (like `registerUser` in [registration.service.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/services/registration.service.js)) executes the business logic.
* **Role:** This is the brain of the application. The service evaluates business rules:
  * Does the event exist?
  * Is the event in the future?
  * Is the event already full? (preventing overbooking)
* **Outcome:** It orchestrates reads and writes by talking to the Database Models.

### Step 6: Model & Database Layer (`src/models/` & `src/db/`)
* **What happens:** The models (like [registration.model.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/models/registration.model.js)) communicate directly with SQLite.
* **Role:** This is the hands-on data worker. It encapsulates raw SQL queries (like `INSERT INTO registrations`, `SELECT COUNT(*)`, etc.). We use atomic queries (like `INSERT INTO ... SELECT ... WHERE count < totalSeats`) to ensure that multiple operations run concurrently without race conditions.

### Step 7: Response & Error Handling (`src/middlewares/error.middleware.js`)
* **What happens:** 
  * **On Success:** The service returns data to the controller, which sends a `200 OK` status and a success message back to the client.
  * **On Failure:** If a service check fails or a database constraint is hit (e.g. duplicate user registration), an error is thrown. The controller catches it and forwards it via `next(error)` to the global error handler in [error.middleware.js](file:///c:/Users/ibrah/OneDrive/Desktop/event-registration-system/src/middlewares/error.middleware.js).
* **Role:** The error handler standardizes error messages. It logs details for the developer and responds to the client with appropriate HTTP status codes (like `409 Conflict`, `404 Not Found`, etc.) in a consistent JSON format.

---

## Why Use This Multi-Layered Architecture?

This design pattern is called **Separation of Concerns**. By breaking the application into layers, we achieve several major benefits:

1. **Maintainability:** If we need to change how registrations are saved (e.g., swapping SQLite for MongoDB), we only modify the **Model** files. The Controllers, Routes, and Services remain completely untouched.
2. **Reusability:** You can easily call service logic from another part of the system or run automated tests directly against services and models without spinning up Express.
3. **Testability:** Having isolated layers makes it easy to write unit tests for validation, models, or concurrent flows separately.
4. **Clarity:** Developers know exactly where to look for validation rules (Middlewares), endpoint structures (Routes), business restrictions (Services), and database interactions (Models).
