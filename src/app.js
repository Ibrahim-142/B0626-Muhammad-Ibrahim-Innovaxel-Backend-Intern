const express = require("express");
const eventRoutes = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use('/events', eventRoutes);
app.use('/registrations', registrationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;