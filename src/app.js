const express = require("express");
const eventRoutes=require('./routes/event.routes')
const registrationRoutes = require('./routes/registration.routes')

const app = express();

app.use(express.json());
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
module.exports = app;