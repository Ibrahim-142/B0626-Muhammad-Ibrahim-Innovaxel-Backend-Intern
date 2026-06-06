const express = require("express");
const eventRoutes=require('./routes/event.routes')

const app = express();

app.use(express.json());
app.use('/api/events', eventRoutes);
module.exports = app;