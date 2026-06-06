const Event = require("../models/event.model");
const Registration = require("../models/registration.model");
const eventLocks = new Map();

const registerUser = async (userName, eventId) => {
  while (eventLocks.get(eventId)) {
    await new Promise((r) => setTimeout(r, 50));
  }

  eventLocks.set(eventId, true);

  try {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const already = await Registration.findActive(userName, eventId);
    if (already) throw new Error("User already registered");

    const count = await Registration.countActiveByEvent(eventId);
    if (count >= event.totalSeats) {
      throw new Error("Event is full");
    }

    return await Registration.create(userName, eventId);
  } finally {
    eventLocks.set(eventId, false);
  }
};

const cancelRegistration = async (userName, eventId) => {
  return Registration.cancel(userName, eventId);
};

module.exports = { registerUser, cancelRegistration };