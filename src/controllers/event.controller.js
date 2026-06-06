const EventService = require("../services/event.service");
const { success } = require("../utils/response.util");

const createEvent = async (req, res) => {
  const result = await EventService.createEvent(req.body);
  success(res, result, "Event created");
};

const getEvents = async (req, res) => {
  const events = await EventService.getEvents();
  success(res, events);
};

module.exports = { createEvent, getEvents };