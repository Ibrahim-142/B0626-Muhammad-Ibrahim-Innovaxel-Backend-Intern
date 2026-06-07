const router = require("express").Router();
const controller = require("../controllers/registration.controller");
const { validateRegistration } = require("../middlewares/validate.middleware");

router.post("/register", validateRegistration, controller.register);
router.post("/cancel", validateRegistration, controller.cancel);

module.exports = router;