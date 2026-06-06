const RegService = require("../services/registration.service");

const register = async (req, res) => {
  const { userName, eventId } = req.body;
  const result = await RegService.registerUser(userName, eventId);
  res.json({ success: true, data: events, message: "Registration Success" });
};

const cancel = async (req, res) => {
  const { userName, eventId } = req.body;
  await RegService.cancelRegistration(userName, eventId);
  res.json({ success: true, data: events, message: "Registration Cancelled" });
  
};

module.exports = { register, cancel };