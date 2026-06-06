const router = require("express").Router();
const controller = require("../controllers/registration.controller");

router.post("/register", controller.register);
router.post("/cancel", controller.cancel);

module.exports = router;