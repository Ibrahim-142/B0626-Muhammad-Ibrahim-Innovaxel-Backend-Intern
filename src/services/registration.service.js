const Event = require("../models/event.model");
const Registration = require("../models/registration.model");
const registerUser = async (userName, eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  if (new Date(event.eventDate) <= new Date()) {
    const err = new Error("Cannot register for a past event");
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = await Registration.createAtomic(userName, eventId);
    if (result.changes === 0) {
      const existing = await Registration.findByUserAndEvent(userName, eventId);
      if (existing && existing.status === "active") {
        const err = new Error("User already registered");
        err.statusCode = 409;
        throw err;
      }
      const err = new Error("Event is full");
      err.statusCode = 409;
      throw err;
    }
    return { id: result.id };
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      const existing = await Registration.findByUserAndEvent(userName, eventId);
      if (existing) {
        if (existing.status === "active") {
          const error = new Error("User already registered");
          error.statusCode = 409;
          throw error;
        }

        const updateResult = await Registration.activateAtomic(userName, eventId);
        if (updateResult.changes === 0) {
          const error = new Error("Event is full");
          error.statusCode = 409;
          throw error;
        }
        return { id: existing.id };
      }
    }
    throw err;
  }
};

const cancelRegistration = async (userName, eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  try {
    return await Registration.cancel(userName, eventId);
  } catch (err) {
    if (err.message === "User is not registered for this event") {
      const error = new Error("Registration not found");
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

module.exports = { registerUser, cancelRegistration };