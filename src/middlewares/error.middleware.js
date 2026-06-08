const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = null;

  // Handle SQLite UNIQUE constraint errors
  if (err.message && err.message.includes("UNIQUE constraint failed")) {
    statusCode = 409;
    if (err.message.includes("events.name")) {
      message = "Event name already exists";
    } else {
      const match = err.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
      if (match) {
        const table = match[1];
        const field = match[2];
        message = `A ${table} with this ${field} already exists. Please use a different ${field}.`;
        details = { field, table };
      }
    }
  }
  // Handle SQLite NOT NULL constraint errors
  else if (err.message && err.message.includes("NOT NULL constraint failed")) {
    statusCode = 400;
    const match = err.message.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
    if (match) {
      const table = match[1];
      const field = match[2];
      message = `The field '${field}' is required but was not provided.`;
      details = { field, table };
    }
  }
  // Handle SQLite FOREIGN KEY constraint errors
  else if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
    statusCode = 400;
    message = "Invalid reference: The related record does not exist in the database.";
  }
  // Handle Prisma errors
  else if (err.code === "P2002") {
    statusCode = 409;
    const field = err.meta?.target?.[0] || "field";
    message = `A user with this ${field} already exists. Please use a different ${field}.`;
    details = { field };
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "The requested resource was not found. It may have been deleted.";
  } else if (err.code === "P2003") {
    statusCode = 400;
    message = "Invalid reference: The related record does not exist.";
  } else if (err.code === "P2014") {
    statusCode = 400;
    message = "Required relation violation: Cannot proceed without the required relationship.";
  } else if (err.code?.startsWith("P")) {
    statusCode = 400;
    message = "Database operation failed. Please check your input and try again.";
  }
  // Handle validation errors
  else if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed: Please check your input fields.";
    details = err.details || {};
  }
  // Log error for debugging
  console.error({
    timestamp: new Date().toISOString(),
    statusCode,
    message,
    originalError: process.env.NODE_ENV === "development" ? err.message : undefined,
    path: req.path,
    method: req.method,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
};

module.exports = errorHandler;