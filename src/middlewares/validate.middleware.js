const validateEvent = (req, res, next) => {
  const { name, totalSeats, eventDate } = req.body;

  // Allowed fields only
  const allowedFields = ["name", "totalSeats", "eventDate"];
  const receivedFields = Object.keys(req.body);

  const unexpectedFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Unexpected field(s): ${unexpectedFields.join(", ")}`,
    });
  }

  // Required fields
  if (
    name === undefined ||
    totalSeats === undefined ||
    eventDate === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "name, totalSeats and eventDate are required",
    });
  }

  // Name validation
  if (typeof name !== "string") {
    return res.status(400).json({
      success: false,
      message: "Event name must be a string",
    });
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return res.status(400).json({
      success: false,
      message: "Event name cannot be empty",
    });
  }

  if (trimmedName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Event name cannot exceed 100 characters",
    });
  }

  // totalSeats validation
  const seats = Number(totalSeats);

  if (!Number.isFinite(seats)) {
    return res.status(400).json({
      success: false,
      message: "Total seats must be a valid number",
    });
  }

  if (!Number.isInteger(seats)) {
    return res.status(400).json({
      success: false,
      message: "Total seats must be an integer",
    });
  }

  if (seats <= 0) {
    return res.status(400).json({
      success: false,
      message: "Total seats must be greater than 0",
    });
  }

  // Optional business limit
  if (seats > 100000) {
    return res.status(400).json({
      success: false,
      message: "Total seats exceeds maximum allowed limit",
    });
  }

  // eventDate validation
  if (typeof eventDate !== "string") {
    return res.status(400).json({
      success: false,
      message: "Event date must be a string",
    });
  }

  const trimmedDate = eventDate.trim();

  if (!trimmedDate) {
    return res.status(400).json({
      success: false,
      message: "Event date cannot be empty",
    });
  }

  const parsedDate = new Date(trimmedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid event date format",
    });
  }

  if (parsedDate <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Event date must be in the future",
    });
  }

  // Normalize data before passing forward
  req.body = {
    name: trimmedName,
    totalSeats: seats,
    eventDate: parsedDate.toISOString(),
  };

  next();
};

const validateRegistration = (req, res, next) => {
  const { userName, eventId } = req.body;

  // Allowed fields only
  const allowedFields = ["userName", "eventId"];
  const receivedFields = Object.keys(req.body);

  const unexpectedFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Unexpected field(s): ${unexpectedFields.join(", ")}`,
    });
  }

  // Required fields
  if (userName === undefined || eventId === undefined) {
    return res.status(400).json({
      success: false,
      message: "userName and eventId are required",
    });
  }

  // userName validation
  if (typeof userName !== "string") {
    return res.status(400).json({
      success: false,
      message: "userName must be a string",
    });
  }

  const trimmedUserName = userName.trim();

  if (!trimmedUserName) {
    return res.status(400).json({
      success: false,
      message: "User name cannot be empty",
    });
  }

  if (trimmedUserName.length > 50) {
    return res.status(400).json({
      success: false,
      message: "userName cannot exceed 50 characters",
    });
  }

  // eventId validation
  const eventIdNum = Number(eventId);

  if (!Number.isFinite(eventIdNum)) {
    return res.status(400).json({
      success: false,
      message: "eventId must be a valid number",
    });
  }

  if (!Number.isInteger(eventIdNum)) {
    return res.status(400).json({
      success: false,
      message: "eventId must be an integer",
    });
  }

  if (eventIdNum <= 0) {
    return res.status(400).json({
      success: false,
      message: "eventId must be greater than 0",
    });
  }

  // Normalize data before passing forward
  req.body = {
    userName: trimmedUserName,
    eventId: eventIdNum,
  };

  next();
};

module.exports = {
  validateEvent,
  validateRegistration,
};