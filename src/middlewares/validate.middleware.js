const validateEvent = (req, res, next) => {
  const { name, totalSeats, eventDate } = req.body;

  if (!name || !totalSeats || !eventDate) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (totalSeats <= 0) {
    return res.status(400).json({ message: "Seats must be > 0" });
  }

  if (new Date(eventDate) <= new Date()) {
    return res.status(400).json({ message: "Event must be future date" });
  }

  next();
};

module.exports = { validateEvent };