const RegService = require("../services/registration.service");
const { success } = require("../utils/response.util");

const register = async (req, res) => {
  const { userName, eventId } = req.body;
  const result = await RegService.registerUser(userName, eventId);
  success(res, result, "Registered successfully");
};

const cancel = async (req, res) => {
  const { userName, eventId } = req.body;
  await RegService.cancelRegistration(userName, eventId);
  success(res, null, "Cancelled successfully");
};

module.exports = { register, cancel };