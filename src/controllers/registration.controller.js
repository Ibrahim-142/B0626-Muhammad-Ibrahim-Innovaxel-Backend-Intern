const RegService = require("../services/registration.service");

const register = async (req, res, next) => {
  try {
    const { userName, eventId } = req.body;
    const result = await RegService.registerUser(userName, eventId);
    res.json({ success: true, data: result, message: "Registration Success" });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { userName, eventId } = req.body;
    const result = await RegService.cancelRegistration(userName, eventId);
    res.json({ success: true, data: result, message: "Registration Cancelled" });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, cancel };