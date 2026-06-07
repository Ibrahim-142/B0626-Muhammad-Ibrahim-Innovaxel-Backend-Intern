const EventService = require("../services/event.service");

const createEvent = async (req, res, next) => {
  try {
    const result = await EventService.createEvent(req.body);
    res.json({ success: true, data: result, message: "Event created" });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await EventService.getEvents();
    res.json({ success: true, data: events, message: "Events retrieved" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents };