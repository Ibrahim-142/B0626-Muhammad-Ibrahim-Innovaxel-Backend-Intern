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

const getSortedEvents = async (req, res, next) => {
  try {
    const events = await EventService.getEvents();

    let filteredEvents = events;
    if (req.query.upcoming === "true") {
      const now = new Date();
      filteredEvents = events.filter((event) => new Date(event.eventDate) > now);
    }

    const sortOrder = req.query.sort === "desc" ? "desc" : "asc";
    filteredEvents.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    res.json({ success: true, data: filteredEvents, message: "Events retrieved" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, getSortedEvents };