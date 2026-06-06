const EventService = require("../services/event.service");

const createEvent = async (req, res) => {
  const result = await EventService.createEvent(req.body);
    res.json({ success: true, data: events, message: "Events retrieved" });

};

const getEvents = async (req, res) => {
  const events = await EventService.getEvents();
  res.json({ success: true, data: events, message: "Events retrieved" });
};

module.exports = { createEvent, getEvents };