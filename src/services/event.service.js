const Event = require("../models/event.model");

const createEvent = async (data) => {
  return Event.create(data.name, data.totalSeats, data.eventDate);
};

const getEvents = async () => {
  return Event.getAll();
};

module.exports = { createEvent, getEvents };